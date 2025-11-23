import type { Track } from './types';

export const MOCK_TRACKS: Track[] = [
    // Fantasy - Action - Combate
    { id: '1', name: 'Epic Battle', url: '/audio/battle1.mp3', type: 'music', frame: 'Fantasy', category: 'Acción', subcategory: 'Combate' },
    { id: '2', name: 'Sword Clash', url: '/audio/battle2.mp3', type: 'music', frame: 'Fantasy', category: 'Acción', subcategory: 'Combate' },

    // Fantasy - Cotidiano - Taberna
    { id: '3', name: 'Lively Tavern', url: '/audio/tavern1.mp3', type: 'music', frame: 'Fantasy', category: 'Cotidiano', subcategory: 'Taberna' },

    // Global - Action - Persecución
    { id: '4', name: 'Run for your life', url: '/audio/run.mp3', type: 'music', category: 'Acción', subcategory: 'Persecución' }, // Global (undefined frame)

    // Futurista - Action - Combate
    { id: '5', name: 'Laser Fight', url: '/audio/laser.mp3', type: 'music', frame: 'Futurista', category: 'Acción', subcategory: 'Combate' },
];
