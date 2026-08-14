import browser from 'webextension-polyfill';

export default function Footer() {
  const desc = browser.i18n.getMessage('appDesc');

  return (
    <footer className='App-footer'>
      <p>{desc}</p>
    </footer>
  );
}
