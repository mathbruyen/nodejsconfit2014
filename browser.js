require('./storagestore')(window.localStorage).then(function (api) {
  window.nodejsconfit = api;
  console.log('Installed');
});