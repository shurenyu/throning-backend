const imageUtils = require('../../utils/imageUtils');
const dbUtils = require('../../utils/dbUtils');
const Mixpanel = require('mixpanel');
const mixpanel = Mixpanel.init('bbbec7f27f28682a69cb73c2323279d1');
const bugsnag = require('@bugsnag/js');
const bugsnagExpress = require('@bugsnag/plugin-express');
const bugsnagClient = bugsnag('26ef4241b9b5c6bf255f5c54c6ae144d');
bugsnagClient.use(bugsnagExpress);

const banImage = async (req, res) => {
  const { imageData } = req.body;
  const listData = {};
  listData[imageData] = true;
  const bannedList = await dbUtils.blahGetter('5c59150da8dad54f43a1541f');
  bannedList.random[imageData] = true;
  dbUtils.blahUpdater('5c59150da8dad54f43a1541f', bannedList.random);
  res.send({
    success: true
  });
};

const proccessImage = async (req, res) => {
  //console.log(req.body);
  const imageBase64 = req.body.base;
  const imageType = req.body.type;

  try {
    const imageUri = await imageUtils.uploadImage(imageBase64, imageType);
    console.log(imageUri);
    mixpanel.track('photo upload', { image: imageUri });
    res.status = 200;
    res.send({
      uri: imageUri,
      success: true
    });
  } catch (err) {
    bugsnagClient.notify(err);
    console.log(`Failure to upload image ${err}`);
    res.status = 200;
    res.send({
      success: false,
      uri: null
    });
  }
};

module.exports = { proccessImage, banImage };
