import Header from './Header';
import { Divider } from '@mantine/core';
import Result from './Result';

export default function App() {
  return (
    <div className="App" style={{ color: 'white' }}>
      <Header />
      <Divider />
      <Result />
    </div>
  );
}
