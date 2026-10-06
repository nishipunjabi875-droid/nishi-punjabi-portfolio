class Logger {
  static sanitize(message) {
    if (!message) return '';
    return message
      .replace(/(otp|password|pass|token|cookie|auth)=([^&\s]+)/gi, '$1=***')
      .replace(/(\d{6})/g, (match) => (match === '302015' || match === '110001' ? match : '******'));
  }

  static mask(val) {
    if (!val) return '***';
    if (val.length <= 4) return '***';
    return val.substring(0, 2) + '*'.repeat(val.length - 4) + val.substring(val.length - 2);
  }

  static info(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] [INFO] ${this.sanitize(message)}`);
  }

  static pass(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.log(`[${timestamp}] [PASS] ${this.sanitize(message)}`);
  }

  static fail(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.error(`[${timestamp}] [FAIL] ${this.sanitize(message)}`);
  }

  static warn(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    console.warn(`[${timestamp}] [WARN] ${this.sanitize(message)}`);
  }
}

module.exports = { Logger };
