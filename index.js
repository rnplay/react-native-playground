import React from 'react';
import { Platform, NativeModules } from 'react-native';
import Exponent from 'exponent';

function wrapWithPlaygroundAppContainer(App) {
  class PlaygroundApp extends React.Component {
    componentWillMount() {
      // Poll on device, and also (temporarily) on iOS, until shake is
      // implemented for Exponent
      if (Exponent.Constants.isDevice || Platform.OS === 'ios') {
        return this._startPolling();
      }

      // Temporarily polling always, until shakeDevice is implemented for Android
      // simulators on Appetize. This is just a fallback in case the location
      // change hack doesn't work for some reason
      this._startPolling();

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

    _startPolling = async () => {
      let lastUpdatedAt = await this._fetchLastUpdatedAsync();

      setInterval(async () => {
        let updatedAt = await this._fetchLastUpdatedAsync();
        if (lastUpdatedAt !== updatedAt) {
          NativeModules.ExponentUtil.reload();
        }
      }, 5000);
    }

    _fetchLastUpdatedAsync = async () => {
      let { id } = this.props.exp.manifest;
      let urlToken = id.split('/')[1];
      let opts = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      };
      let response = await fetch(`https://rnplay.org/apps/${urlToken}/last_updated`, opts);
      let result = await response.json();
      return result.updated_at;
    }

    render() {
      return <App />
    }
  }

  return PlaygroundApp;
}

export function registerComponent(App) {
  return Exponent.registerRootComponent(wrapWithPlaygroundAppContainer(App));
}
