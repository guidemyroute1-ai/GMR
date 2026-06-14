const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withManifestToolsReplace(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // Ensure xmlns:tools is present on the manifest element
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Add tools:replace="android:resource" to the specific Firebase messaging meta-data elements
    const application = androidManifest.manifest.application[0];
    if (application['meta-data']) {
      application['meta-data'].forEach((metaData) => {
        const name = metaData.$['android:name'];
        if (
          name === 'com.google.firebase.messaging.default_notification_color' ||
          name === 'com.google.firebase.messaging.default_notification_icon'
        ) {
          metaData.$['tools:replace'] = 'android:resource';
        }
      });
    }

    return config;
  });
};
