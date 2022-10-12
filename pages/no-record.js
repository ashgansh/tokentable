import { useEffect } from "react"

const NoRecordPage = () => {
  useEffect(() => {
    localStorage.setItem("norecords", "true")
  }, [])
  return "OK"
}
export default NoRecordPage