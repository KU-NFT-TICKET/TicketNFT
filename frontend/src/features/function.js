import CryptoJS from 'crypto-js'

export function check_format_thaiID(thai_id) {
	if (/[0-9]{13}/.test(thai_id)) {
	  var input_sum = 0
	  for (var i = 0; i < 12; i++) { input_sum += (parseInt(thai_id[i]) * (13-i)) }
	  var remainde_str = (11 - (input_sum % 11)).toString()
	  var last_char_check = remainde_str[remainde_str.length-1]
	  if (thai_id[12] === last_char_check) {
	    return true
	  } else {
	    return false
	  }
	}  else {
	  return false
	}
}

export function encode_thaiID(thai_id, address) {
	const passphrase = address
	const inpututf = CryptoJS.enc.Utf8.parse(thai_id);
	const keyutf = CryptoJS.enc.Utf8.parse(passphrase);
	const iv = CryptoJS.enc.Base64.parse(address);
	return CryptoJS.AES.encrypt(thai_id, passphrase).toString()
}

export function decode_thaiID(ciphertext, address) {
	const passphrase = address;
	const inpututf = CryptoJS.enc.Base64.parse(ciphertext);
	const iv = CryptoJS.enc.Base64.parse(passphrase);
	const keyutf = CryptoJS.enc.Utf8.parse(passphrase);
	const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
	const originalText = bytes.toString(CryptoJS.enc.Utf8);
	return originalText;
}