const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withManifestToolsReplace(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application?.[0];

    if (application) {
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }
      let metaData = application['meta-data'].find(
        (item) => item.$ && item.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
      );
      if (!metaData) {
        metaData = { $: { 'android:name': 'com.google.firebase.messaging.default_notification_color' } };
        application['meta-data'].push(metaData);
      }
      metaData.$['tools:replace'] = 'android:resource';
    }

    // Ensure xmlns:tools is present in the manifest root
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });
};

