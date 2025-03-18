import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import bracketData from './data/final_bracket.json';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const REGIONS = ['East', 'West', 'South', 'Midwest'];

const App = () => {
  const [selectedRegion, setSelectedRegion] = useState('East');
  const [selectedMatchup, setSelectedMatchup] = useState(null);
  const [view, setView] = useState('bracket'); // 'bracket', 'stats', 'upsets'

  // Extract first round matchups for the selected region
  const regionMatchups = bracketData.first_round[selectedRegion] || [];

  // Calculate upset probabilities for visualization
  const upsetProbabilities = REGIONS.map(region => {
    const matchups = bracketData.first_round[region] || [];
    const upsets = matchups.filter(matchup => {
      const team1Seed = parseInt(matchup.team1.seed.replace(/[a-z]/g, ''));
      const team2Seed = parseInt(matchup.team2.seed.replace(/[a-z]/g, ''));
      return team1Seed > team2Seed && matchup.winner.name === matchup.team1.name;
    });
    
    return {
      region,
      upsetCount: upsets.length,
      totalMatchups: matchups.length,
      upsetPercentage: (upsets.length / matchups.length) * 100
    };
  });

  // Extract all matchups with upset probabilities for visualization
  const allMatchupsWithProbabilities = REGIONS.flatMap(region => {
    return (bracketData.first_round[region] || []).map(matchup => {
      const team1Seed = parseInt(matchup.team1.seed.replace(/[a-z]/g, ''));
      const team2Seed = parseInt(matchup.team2.seed.replace(/[a-z]/g, ''));
      const higherSeedTeam = team1Seed < team2Seed ? matchup.team1 : matchup.team2;
      const lowerSeedTeam = team1Seed > team2Seed ? matchup.team1 : matchup.team2;
      
      return {
        matchupName: `${matchup.team1.name} vs ${matchup.team2.name}`,
        region,
        upsetProbability: matchup.probability * 100,
        higherSeed: higherSeedTeam.name,
        lowerSeed: lowerSeedTeam.name,
        winner: matchup.winner.name,
        isUpset: matchup.winner.name === lowerSeedTeam.name
      };
    });
  });

  // Sort matchups by upset probability
  const sortedMatchups = [...allMatchupsWithProbabilities].sort((a, b) => b.upsetProbability - a.upsetProbability);
  
  // Top 5 potential upsets
  const topUpsets = sortedMatchups.filter(m => m.upsetProbability > 30).slice(0, 5);

  // Champion data for pie chart
  const championData = [
    { name: bracketData.champion.name, value: bracketData.champion.probability * 100 },
    { name: 'Other Teams', value: 100 - (bracketData.champion.probability * 100) }
  ];

  const handleMatchupClick = (matchup) => {
    setSelectedMatchup(matchup);
  };

  const renderBracketView = () => (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">First Round Matchups - {selectedRegion} Region</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionMatchups.map((matchup, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-lg cursor-pointer hover:bg-blue-50 ${selectedMatchup === matchup ? 'bg-blue-100 border-blue-500' : ''}`}
            onClick={() => handleMatchupClick(matchup)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold ${matchup.winner.name === matchup.team1.name ? 'text-green-600' : ''}`}>
                ({matchup.team1.seed}) {matchup.team1.name}
              </span>
              <span className="text-sm">
                {matchup.winner.name === matchup.team1.name ? '✓' : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${matchup.winner.name === matchup.team2.name ? 'text-green-600' : ''}`}>
                ({matchup.team2.seed}) {matchup.team2.name}
              </span>
              <span className="text-sm">
                {matchup.winner.name === matchup.team2.name ? '✓' : ''}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Win Probability: {(matchup.probability * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {selectedMatchup && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-bold mb-4">Matchup Analysis</h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h4 className="font-bold">{selectedMatchup.team1.name} ({selectedMatchup.team1.seed})</h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Seed strength factor: {(1/parseInt(selectedMatchup.team1.seed.replace(/[a-z]/g, ''))).toFixed(2)}</li>
                <li>Historical win rate for seed: {getSeedHistoricalWinRate(selectedMatchup.team1.seed)}%</li>
                <li>{getTeamStrengthDescription(selectedMatchup.team1.name)}</li>
              </ul>
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{selectedMatchup.team2.name} ({selectedMatchup.team2.seed})</h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Seed strength factor: {(1/parseInt(selectedMatchup.team2.seed.replace(/[a-z]/g, ''))).toFixed(2)}</li>
                <li>Historical win rate for seed: {getSeedHistoricalWinRate(selectedMatchup.team2.seed)}%</li>
                <li>{getTeamStrengthDescription(selectedMatchup.team2.name)}</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="font-bold">Prediction: {selectedMatchup.winner.name} wins ({(selectedMatchup.probability * 100).toFixed(1)}% probability)</p>
            <p className="mt-2">{getMatchupAnalysis(selectedMatchup)}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsView = () => (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Tournament Statistics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-bold mb-4">Championship Probability</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={championData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {championData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="font-bold text-lg">{bracketData.champion.name} ({bracketData.champion.seed})</p>
            <p>Region: {bracketData.champion.region}</p>
            <p>Championship Probability: {(bracketData.champion.probability * 100).toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-bold mb-4">Upset Potential by Region</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={upsetProbabilities}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis label={{ value: 'Upset Percentage', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="upsetPercentage" name="Upset Percentage" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUpsetsView = () => (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Potential Upsets</h2>
      
      <div className="p-4 border rounded-lg mb-8">
        <h3 className="text-lg font-bold mb-4">Top 5 Potential Upsets</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topUpsets}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="matchupName" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="upsetProbability" name="Upset Probability (%)" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topUpsets.map((matchup, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <h3 className="font-bold text-lg">{matchup.lowerSeed} vs {matchup.higherSeed}</h3>
            <p className="text-sm text-gray-600">Region: {matchup.region}</p>
            <p className="mt-2">Upset Probability: <span className="font-bold">{matchup.upsetProbability.toFixed(1)}%</span></p>
            <p className="mt-2">{getUpsetAnalysis(matchup)}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Helper functions for analysis text
  function getSeedHistoricalWinRate(seed) {
    const seedNum = parseInt(seed.replace(/[a-z]/g, ''));
    const winRates = {
      1: 98.8, 2: 92.9, 3: 84.6, 4: 78.8, 5: 64.7, 6: 62.5, 7: 60.3, 8: 48.1,
      9: 51.9, 10: 39.7, 11: 37.5, 12: 35.3, 13: 21.2, 14: 15.4, 15: 7.1, 16: 1.2
    };
    return winRates[seedNum] || 50;
  }

  function getTeamStrengthDescription(teamName) {
    const teamDescriptions = {
      'Duke': 'Elite offensive and defensive efficiency with Cooper Flagg as a dominant force',
      'Alabama': 'Strong offensive firepower but defensive vulnerabilities and injury concerns',
      'Kentucky': 'Tournament experience under Calipari with home court advantage',
      'Florida': 'Elite balanced team with strong coaching and offensive versatility',
      'Michigan': 'Experienced tournament team with inconsistent performance',
      'UC San Diego': '15-game winning streak entering tournament with momentum',
      'Auburn': 'Elite efficiency metrics with interior dominance from Johni Broome',
      'Michigan State': 'Tom Izzo\'s exceptional tournament coaching and seven-game win streak',
      'Houston': 'Best defensive efficiency in nation with 19-1 conference record',
      'Iowa State': 'Elite defensive metrics with some injury concerns'
    };
    
    return teamDescriptions[teamName] || 'Balanced team with typical strengths and weaknesses for their seed';
  }

  function getMatchupAnalysis(matchup) {
    const team1Seed = parseInt(matchup.team1.seed.replace(/[a-z]/g, ''));
    const team2Seed = parseInt(matchup.team2.seed.replace(/[a-z]/g, ''));
    const isUpset = (team1Seed > team2Seed && matchup.winner.name === matchup.team1.name) || 
                   (team2Seed > team1Seed && matchup.winner.name === matchup.team2.name);
    
    const matchupAnalyses = {
      'Duke vs American': 'Duke\'s overwhelming talent advantage and momentum from 19-1 run makes this a near-certain victory.',
      'Kentucky vs Team_East_9': 'Kentucky\'s home court advantage in Lexington gives them the edge in this otherwise even 8-9 matchup.',
      'Michigan vs UC San Diego': 'Despite UC San Diego\'s 15-game win streak, Michigan\'s tournament experience and talent advantage should prevail in a close game.',
      'Auburn vs Team_South_16b': 'Auburn\'s elite efficiency metrics make this a standard 1-16 matchup with minimal upset potential.',
      'Michigan State vs Team_South_15': 'Tom Izzo\'s exceptional tournament record and Michigan State\'s momentum make this one of the safest 2-15 matchups.',
      'Houston vs Team_Midwest_16b': 'Houston\'s elite defense and Kelvin Sampson\'s coaching create an overwhelming advantage in this 1-16 matchup.',
      'Florida vs Team_West_16a': 'Florida\'s balanced attack and offensive versatility make this a standard 1-16 matchup with minimal upset potential.'
    };
    
    const key = `${matchup.team1.name} vs ${matchup.team2.name}`;
    
    if (matchupAnalyses[key]) {
      return matchupAnalyses[key];
    }
    
    if (isUpset) {
      return `This represents a potential upset based on specific team factors that overcome the typical seed advantage. Historical data shows ${Math.min(team1Seed, team2Seed)}-seeds win approximately ${getSeedHistoricalWinRate(Math.min(team1Seed, team2Seed).toString())}% of the time against ${Math.max(team1Seed, team2Seed)}-seeds.`;
    } else {
      return `The higher seed is favored as expected in this matchup. Historical data shows ${Math.min(team1Seed, team2Seed)}-seeds win approximately ${getSeedHistoricalWinRate(Math.min(team1Seed, team2Seed).toString())}% of the time against ${Math.max(team1Seed, team2Seed)}-seeds.`;
    }
  }

  function getUpsetAnalysis(matchup) {
    const upsetAnalyses = {
      'UC San Diego vs Michigan': 'UC San Diego\'s 15-game winning streak and Michigan\'s inconsistency create significant upset potential.',
      'Team_West_9 vs Team_West_8': '8-9 matchups are historically even, with 9-seeds winning 51.9% of these games.',
      'Team_South_9 vs Team_South_8': 'Superior guard play from the 9-seed gives them a slight edge in this traditionally even matchup.',
      'Team_Midwest_9 vs Team_Midwest_8': 'Another close 8-9 matchup with minimal difference in team quality.'
    };
    
    const key = `${matchup.lowerSeed} vs ${matchup.higherSeed}`;
    
    return upsetAnalyses[key] || 'This matchup has upset potential based on specific team factors and historical seed performance patterns.';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">2025 NCAA March Madness Bracket Analysis</h1>
      <p className="text-center mb-6 text-gray-600">Interactive visualization of tournament predictions and upset probabilities</p>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <span className="mr-2 font-bold">Region:</span>
          <div className="inline-flex">
            {REGIONS.map(region => (
              <button
                key={region}
                className={`px-3 py-1 mx-1 rounded ${selectedRegion === region ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setSelectedRegion(region)}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <span className="mr-2 font-bold">View:</span>
          <div className="inline-flex">
            <button
              className={`px-3 py-1 mx-1 rounded ${view === 'bracket' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setView('bracket')}
            >
              Bracket
            </button>
            <button
              className={`px-3 py-1 mx-1 rounded ${view === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setView('stats')}
            >
              Statistics
            </button>
            <button
              className={`px-3 py-1 mx-1 rounded ${view === 'upsets' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setView('upsets')}
            >
              Upsets
            </button>
          </div>
        </div>
      </div>
      
      {view === 'bracket' && renderBracketView()}
      {view === 'stats' && renderStatsView()}
      {view === 'upsets' && renderUpsetsView()}
    </div>
  );
};

export default App;