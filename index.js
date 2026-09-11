import {registerRootComponent} from 'expo';
import mobileAds from 'react-native-google-mobile-ads';
import App from './App';

mobileAds().initialize().catch(() => {});
registerRootComponent(App);
