// energyTypes.js - Definition of energy types for circles
export const energyTypes = [
  {
    id: 'exciter',
    name: 'Exciter',
    description: 'Generates and emits energy to influence inactive circles',
    color: '#FFD700', // Yellow
    icon: '⚡'
  },
  {
    id: 'igniter',
    name: 'Igniter',
    description: 'Generates and emits energy to influence inactive circles',
    color: '#FF8C00', // Orange
    icon: '🔥'
  },
  {
    id: 'dampener',
    name: 'Dampener',
    description: 'Dampens and reduces energy from activated circles',
    color: '#9966FF', // Purple
    icon: '🔇'
  },
  {
    id: 'attractor',
    name: 'Attractor', 
    description: 'Draws and pulls energy from other circles',
    color: '#FF4444', // Red
    icon: '🧲'
  },
  {
    id: 'attractee',
    name: 'Attractee',
    description: 'Receives and responds to energy from other circles', 
    color: '#4488FF', // Blue
    icon: '🎯'
  }
];

export function getEnergyType(id) {
  return energyTypes.find(type => type.id === id);
}

export function getEnergyTypeColor(id) {
  const type = getEnergyType(id);
  return type ? type.color : '#666666';
}

export function getEnergyTypeIcon(id) {
  const type = getEnergyType(id);
  return type ? type.icon : '?';
}
