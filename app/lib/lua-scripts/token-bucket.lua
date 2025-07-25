local keyUrl = KEYS[1]
local now = ARGV[1]
local threshold = ARGV[2]
local interval= ARGV[3]
local lastTimeStampKey = "lastTimeStamp"
local extraTimeKey = "extraTime"
local avaNumKey = "avaNum"
local newExtraTime = 0

--@param time 请求时间
--@returns 获取精确的桶次数，补偿
local function getExtraThreshold(time, extraTime)
  local data = tonumber(string.format("%.16f", time / interval / 1000 * threshold)) + extraTime
  local result = math.floor(data)
  newExtraTime = tonumber(string.format("%.16f", data - result))
  return result
end

local function refreshAvailableBucket(timeStamp, lastAvaNum, lastTimeStamp, extraTime) {
  local time = timeStamp - lastTimeStamp
  if time <= 0 then
    return lastAvaNum
  end

  local avaNum = 0
  if time >= interval * 1000 then
    return threshold
  else
    avaNum = getExtraThreshold(time, extraTime)
  end

  -- 可用令牌数不能超过流控数量
  return math.min(avaNum + lastAvaNum, threshold)
end

local result = redis.call('hmget', keyUrl, lastTimeStampKey, extraTimeKey, avaNumKey)
local lastTimeStamp = 0
if result ~= nil and result[1] then
  lastTimeStamp = tonumber(result[1])
end

local extraTime = 0
if result ~= nil and result[2] then
  extraTime = tonumber(result[2])
end 
local tempExtraTime = extraTime
newExtraTime = extraTime
local avaNum = 0
if result ~= nil and result[3] then
  avaNum = tonumber(result[3])
end

avaNum = tonumber(refreshAvailableBucket(now, avaNum, lastTimeStamp, tempExtraTime))

-- 令牌桶满了， 没有可用令牌
if avaNum <= 0 then
  -- 还原补偿时间
  redis.call('hmset', keyUrl, extraTimeKey, tempExtraTime, avaNumKey, avaNum)
  return 1
end

avaNum = avaNum - 1
redis.call('hmset', keyUrl, extraTimeKey, newExtraTime, avaNumKey, avaNum, lastTimeStampKey, now)
return 0