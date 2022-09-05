import { formatUnits } from "ethers/lib/utils"


function nFormatter(num, digits) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

export const formatToken = (symbol, decimals, amount, shorten = false) => {
  const amountNumber = (+formatUnits(amount, decimals)).toFixed(2)

  if (shorten)
    return `${nFormatter(amountNumber, 2)} ${symbol}`

  const formattedAmount = amountNumber.replace(/\d(?=(\d{3})+\.)/g, '$&,')
  return `${formattedAmount} ${symbol}`
}

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}
