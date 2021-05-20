const GoogleLocations = require('google-locations');
const dbUtils = require('../../utils/dbUtils');

const locations = new GoogleLocations('AIzaSyCVZCul5NM6o3w5T2nBK91kmZAnE8kfpDI');

const getCityDetials = async (req, res) => {
  const { city } = req.body;
  try {
    locations.autocomplete({ input: city, types: '(cities)' }, (err, response) => {
      const cityTemplate = {
        addressComponents: {
          administrative_area_level_2: null,
          administrative_area_level_1: null,
          country: null,
          locality: null
        },
        longitude: null,
        priceLevel: -1,
        rating: 0,
        south: null,
        latitude: null,
        address: null,
        placeID: null,
        types: ['locality', 'political'],
        west: null,
        east: null,
        north: null,
        name: null
      };
      locations.details({ placeid: response.predictions[0].place_id }, (err, response) => {
        const results = response.result;
        cityTemplate.addressComponents.administrative_area_level_2 =
          results.address_components[1].long_name;
        cityTemplate.addressComponents.administrative_area_level_1 =
          results.address_components[2].long_name;
        cityTemplate.addressComponents.country = results.address_components[3].long_name;
        cityTemplate.addressComponents.locality = results.address_components[0].long_name;
        cityTemplate.longitude = results.geometry.location.lng;
        cityTemplate.latitude = results.geometry.location.lat;
        cityTemplate.address = results.formatted_address;
        cityTemplate.placeID = results.place_id;
        cityTemplate.name = results.name;
        res.send({ success: true, details: cityTemplate });
      });
    });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(`error getting city data ${e}`);
    res.send({ success: false });
  }
};

const getSearchResults = async (req, res) => {
  const { keyword } = req.body;
  try {
    locations.autocomplete({ input: keyword }, (err, response) => {
      res.send({ success: true, results: response.predictions });
    });
  } catch (e) {
    bugsnagClient.notify(e);
    console.log(e);
    res.send({ success: false, results: [] });
  }
};

const getPlaceDetails = async (req, res) => {
  const { placeId } = req.body;
  const locationTemplate = {
    name: null,
    data: {
      addressComponents: {
        route: null,
        administrative_area_level_2: null,
        neighborhood: null,
        postal_code: null,
        street_number: null,
        administrative_area_level_1: null,
        country: null,
        locality: null
      },
      longitude: null,
      priceLevel: -1,
      rating: 0,
      south: null,
      latitude: null,
      address: null,
      placeID: placeId,
      types: ['street_address'],
      west: null,
      east: null,
      north: null,
      name: null
    }
  };
  locations.details({ placeid: placeId }, (err, response) => {
    try {
      const results = response.result;
      locationTemplate.name = results.name;
      locationTemplate.data.longitude = results.geometry.location.lng;
      locationTemplate.data.latitude = results.geometry.location.lat;
      locationTemplate.data.addressComponents.locality = results.address_components[4].long_name;
      locationTemplate.data.address = results.formatted_address;
      locationTemplate.data.name = results.name;
      if (results.address_components[6].long_name) {
        locationTemplate.data.addressComponents.administrative_area_level_1 =
          results.address_components[6].long_name;
      } else {
        locationTemplate.data.addressComponents.administrative_area_level_1 =
          results.address_components[5].long_name;
      }
      res.send({ success: true, details: locationTemplate });
    } catch (e) {
      bugsnagClient.notify(e);
      console.log('error getting location: ', e);
      res.send({ success: true, details: locationTemplate });
    }
  });
};

module.exports = { getCityDetials, getSearchResults, getPlaceDetails };
