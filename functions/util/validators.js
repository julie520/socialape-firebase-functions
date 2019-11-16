const isEmpty = val => {
  if (val.trim() === "") return true;
  return false;
};

const isNull = val => {
  if (val === undefined || val === null) return true;
  return false;
};

const isNullOrEmpty = val => {
  if (val === undefined || val === null) return true;
  if (val.trim() === "") return true;
  return false;
};

const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  return false;
};

exports.validateSignup = data => {
  const { email, password, confirmPassword, handle } = data;

  /// TODO: validate data
  let errors = {};
  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Email must not be valid email address";
  }

  if (isEmpty(password)) {
    errors.password = "Password must not be empty";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Password must not be same";
  }

  if (isEmpty(handle)) {
    errors.handle = "Handle must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.validateLogin = data => {
  const { email, password } = data;
  let errors = {};
  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Email must not be valid email address";
  }

  if (isEmpty(password)) {
    errors.password = "Password must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};

exports.reduceUserDetail = data => {
  const { bio, website, location } = data;
  let userDetails = {};

  if (!isNull(bio)) userDetails.bio = bio.trim();

  if (!isNull(website)) {
    // https://website.com
    userDetails.website = website.trim();
    if (
      userDetails.website.indexOf(".") !== -1 &&
      userDetails.website.substring(0, 4) !== "http"
    ) {
      userDetails.website = `https://${userDetails.website}`;
    }
  }
  if (!isNull(location)) userDetails.location = location.trim();
  return {
    userDetails,
    valid: Object.keys(userDetails).length > 0
  };
};

exports.validateParam = val => {
  return {
    valid: !isNullOrEmpty(val)
  };
};

exports.validateAddComment = (val, data) => {
  const { body } = data;
  let errors = {};
  if (isNullOrEmpty(val)) {
    errors.scream = "Scream not found";
  }
  if (isNullOrEmpty(body)) {
    errors.body = "Please send comment";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0
  };
};
