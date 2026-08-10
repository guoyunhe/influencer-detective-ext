export default function App() {
  const title = chrome.i18n.getMessage('appName');
  return (
    <div className="App" style={{ color: 'white' }}>
      <h1>{title}</h1>
      <p>Popup content goes here.</p>
    </div>
  );
}
