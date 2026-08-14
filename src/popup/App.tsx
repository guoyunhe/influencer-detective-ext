import { Divider } from '@mantine/core';

import Header from './Header';
import Result from './Result';

export default function App() {
  return (
    <div className='App' style={{ color: 'white' }}>
      <Header />
      <Divider />
      <Result />
    </div>
  );
}
