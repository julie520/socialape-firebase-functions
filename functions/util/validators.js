const isEmpty = string => {
  if (string.trim() === "") return true;
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
