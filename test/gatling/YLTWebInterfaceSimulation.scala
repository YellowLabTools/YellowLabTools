package computerdatabase // 1

import io.gatling.core.Predef._ // 2
import io.gatling.http.Predef._
import scala.concurrent.duration._

class YLTWebInterfaceSimulation extends Simulation {

  val httpConf = http
    .baseURL("http://localhost:8383")
    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .doNotTrackHeader("1")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Mozilla/5.0 (Windows NT 5.1; rv:31.0) Gecko/20100101 Firefox/31.0")

  val scn = scenario("YLTWebInterfaceSimulation")
    .exec(http("home page")
      .get("/")
    )
    .exec(http("static asset")
      .get("/front/fonts/icons.woff")  
    )
    .pause(100 milliseconds)
    .exec(http("launch run")
      .post("/api/runs")
      .body(StringBody("""{ "url": "http://www.google.com", "waitForResponse":false }""")).asJSON
    )
    .repeat(10, "loop") {
      exec(http("get status")
        .get("/api/runs/dzlqsahu8d")
      )
      .pause(2000 milliseconds)
    }
    .exec(http("get result")
      .get("/api/results/dzlqsahu8d")
    )

  setUp(
    scn.inject(rampUsers(1000) over(60 seconds))
  ).protocols(httpConf)
}