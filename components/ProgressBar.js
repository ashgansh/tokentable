const ProgressBar = ({ percentage, thresholdPercentage, cancelled }) => {
  return (
    <div className="relative w-full bg-gray-200 rounded-full h-2.5">
      {cancelled && (
        <div className="absolute bg-red-400 h-2.5 rounded-full w-full"></div>
      )}
      <div className="absolute bg-blue-600 h-2.5 rounded-full" style={{ width: percentage }}></div>
      <div className="absolute bg-blue-300 h-2.5 rounded-l-full opacity-50" style={{ width: thresholdPercentage }}></div>
    </div>
  )
}

export default ProgressBar