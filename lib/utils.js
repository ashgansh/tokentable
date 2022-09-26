import { formatUnits, getAddress, isAddress } from "ethers/lib/utils"

export const nFormatter = (num, digits) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function (item) {
    return num >= item.value;
  });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

export const formatToken = (amount, decimals, symbol, options) => {
  return formatCurrency(+formatUnits(amount, decimals), symbol, options)
}

export const formatCurrency = (amount, symbol, options) => {
  const opts = {
    symbol: 'postpend',
    ...options
  }

  let formattedAmount = formatAmount(amount, options)

  if (opts.symbol === 'postpend' && symbol) {
    formattedAmount = `${formattedAmount} ${symbol}`
  }

  if (opts.symbol === 'prepend' && symbol) {
    formattedAmount = `${symbol} ${formattedAmount}`
  }

  return formattedAmount
}

export const formatAmount = (amount, options) => {
  const opts = {
    commify: true,
    shorten: false,
    digits: 2,
    ...options
  }

  let formattedAmount = (+amount).toFixed(opts.digits)

  if (opts.shorten) {
    formattedAmount = nFormatter(amount, opts.digits)
  }

  if (opts.commify) {
    formattedAmount = formattedAmount.replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, '$&,')
  }

  return formattedAmount
}

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const shortAddress = (address, length = 8) => (
  `${address.substring(0, (length / 2) + 2)}...${address.substring(address.length - length / 2)}`
)

export const formatAddress = (address) => {
  if (!isAddress(address)) return null
  return getAddress(address)
}