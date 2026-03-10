import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
  stages: [
    { duration: "10s", target: 100 },  // warm up
    { duration: "10s", target: 500 },  // spike
    { duration: "20s", target: 500 },  // hold traffic
    { duration: "10s", target: 0 },    // ramp down
  ],
}

export default function () {

  const headers = {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": `user_${Math.random()}`
    }
  }

  const payload = JSON.stringify({})

  const res = http.post("http://localhost:3000/buy", payload, headers)

  check(res, {
    "status is 200 or 400": (r) => r.status === 200 || r.status === 400,
  })

  sleep(0.1)
}



//what does this file do:
// users hitting /buy simultaneously
// each user has a different userId
// some succeed
// most fail after sellout
