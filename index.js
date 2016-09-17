import React from 'react';
import { AppRegistry, Platform, NativeModules } from 'react-native';
import Exponent from 'exponent';

function wrapWithPlaygroundAppContainer(App) {
  class PlaygroundApp extends React.Component {
    componentWillMount() {
      // Temporary hack until Appetize supports shake on Android simulators
      if (Platform.OS === 'android') {
        let firstUpdateComplete = false;
        let options = {enableHighAccuracy: true, timeInterval: 50, distanceInterval: 1};
        Exponent.Location.watchPositionAsync(options, (coords) => {
          if (firstUpdateComplete) {
            NativeModules.ExponentUtil.reload();
          }
          firstUpdateComplete = true;
        });
      } else {
        DeviceEventEmitter.addListener('Exponent.shake', () => {
          NativeModules.ExponentUtil.reload();
        });
      }
    }

    render() {
      return <App />
    }
  }

  return PlaygroundApp;
}

export function registerComponent(App) {
  return AppRegistry.registerComponent('main', () => wrapWithPlaygroundAppContainer(App));
}
