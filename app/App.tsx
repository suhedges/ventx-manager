import { LogBox } from 'react-native';
import RootLayout from './_layout';

LogBox.ignoreLogs(['Possible Unhandled Promise Rejection']);

export default function App() {
  console.log('App component mounted');
  return <RootLayout />;
}
