import React from 'react';
import React, { useState } from 'react';


import Frontpage from './frontpage';
import Klub from './klub';
import Medlem from './medlem';


export default function App() {
const [screen, setScreen] = useState('frontpage');

if (screen === 'klub') return <Klub onBack={() => setScreen('frontpage')} />;
if (screen === 'medlem') return <Medlem onBack={() => setScreen('frontpage')} />;

return <Frontpage onNavigate={setScreen} />;
}