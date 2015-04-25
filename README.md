# sylvanus
Scripted Ecosystems

TODO

FRUITING CHAMBER:
- heartbeat to spark core
is spark core offline? did it restart? router/WiFi issues...
Router seems to stop working around 12:20AM daily...
Router comes back online around 12:40AM daily...

- if humidity lower than 80%, turn humidifier on
- if humidity higher that 95%, turn humidifier off

OR run humidifier for 60 seconds (raises humidity from 60% to 95%)

- run fan for 30 seconds, 2 times per day
every 24 hours @ 8:00PM : fan on 
every 24 hours @ 8:01PM : fan off


- 12 hours of light per day
- at sunset, turn light on
- 6 hours after light on, turn light off
every 24 hours @ 6:00PM : light on 
every 24 hours @ 12:00AM : light off


INCUBATION CHAMBER:
- 
every 15 seconds : get temperature
  if temp > 90 : heater off
  if temp < 87 : heater on

HUMIDIFIER

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r2,HIGH

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r2,LOW

LAMP

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r3,HIGH

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r3,LOW

FAN 

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,HIGH

curl https://api.spark.io/v1/devices/51ff6b065067545718550287/relay -d access_token=4cd240bd67b599f991439773a1bc5989a0c35081 -d params=r4,LOW



