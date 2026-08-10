import browser from 'webextension-polyfill';
import Header from './Header';
import { Divider } from '@mantine/core';

export default function App() {
  const title = browser.i18n.getMessage('appName');
  return (
    <div className="App" style={{ color: 'white' }}>
      <Header />
      <Divider/>
    </div>
  );
}
