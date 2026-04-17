repeat task.wait() until game:IsLoaded()

-- Config
local SUPABASE_URL  = "https://ofclhcihedjtltiyjkvn.supabase.co"
local SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY2xoY2loZWRqdGx0aXlqa3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTQ2ODMsImV4cCI6MjA5MTM3MDY4M30.Sn4iT6lZghZnMGp4cBxDRfWs-ARoClk437qeEpqPAN0"
local SAB_PLACE_ID  = 109983668079237
local STEAL_WEBHOOK = "https://discord.com/api/webhooks/1491715535350534197/4TqBT7CAbrryR3qNlvkF11O440LuAS-rdOwGFw-pzZ3kiUMJU-UPBYyDoOFPOYaDb8eB"
local SESSION_START = os.date("!%Y-%m-%dT%H:%M:%SZ") -- session start time

-- Services
local Players     = game:GetService("Players")
local TeleportSvc = game:GetService("TeleportService")
local HttpService  = game:GetService("HttpService")
local UserInput    = game:GetService("UserInputService")
local CoreGui      = game:GetService("CoreGui")
local player       = Players.LocalPlayer

local function getHttp()
    return http_request or request or (http and http.request)
end

local old = CoreGui:FindFirstChild("GrandNotifier")
if old then old:Destroy() end

-- Colors (dark theme matching Grand Notifier website)
local BG        = Color3.fromRGB(10, 8, 20)
local HDR_BG    = Color3.fromRGB(15, 12, 30)
local CARD_BG   = Color3.fromRGB(18, 15, 35)
local CARD_BG2  = Color3.fromRGB(22, 18, 42)
local BORDER    = Color3.fromRGB(45, 35, 80)
local BORDER2   = Color3.fromRGB(35, 28, 65)

local TXT_WHITE  = Color3.fromRGB(240, 238, 255)
local TXT_BRIGHT = Color3.fromRGB(200, 195, 235)
local TXT_MID    = Color3.fromRGB(130, 120, 170)
local TXT_DIM    = Color3.fromRGB(80, 72, 120)

local PURPLE     = Color3.fromRGB(150, 80, 255)
local CYAN       = Color3.fromRGB(0, 210, 200)
local PURPLE_DIM = Color3.fromRGB(40, 20, 80)
local CYAN_DIM   = Color3.fromRGB(0, 50, 50)

-- Tier colors
local TIER = {
    low        = { label="15M",  txt=Color3.fromRGB(96,165,250),  badge=Color3.fromRGB(20,40,80),   acc=Color3.fromRGB(59,130,246)  },
    high       = { label="50M",  txt=Color3.fromRGB(167,139,250), badge=Color3.fromRGB(35,20,70),   acc=Color3.fromRGB(124,58,237)  },
    big        = { label="150M", txt=Color3.fromRGB(244,114,182), badge=Color3.fromRGB(60,15,45),   acc=Color3.fromRGB(219,39,119)  },
    beyondbest = { label="1B",   txt=Color3.fromRGB(251,191,36),  badge=Color3.fromRGB(60,40,0),    acc=Color3.fromRGB(245,158,11)  },
    og         = { label="OG",   txt=Color3.fromRGB(52,211,153),  badge=Color3.fromRGB(0,50,30),    acc=Color3.fromRGB(16,185,129)  },
}

local TAB_ON = {
    All  = { bg=Color3.fromRGB(40,20,80),  txt=PURPLE },
    ["15M"]  = { bg=Color3.fromRGB(20,40,80),  txt=Color3.fromRGB(96,165,250)  },
    ["50M"]  = { bg=Color3.fromRGB(35,20,70),  txt=Color3.fromRGB(167,139,250) },
    ["150M"] = { bg=Color3.fromRGB(60,15,45),  txt=Color3.fromRGB(244,114,182) },
    ["1B"]   = { bg=Color3.fromRGB(60,40,0),   txt=Color3.fromRGB(251,191,36)  },
}

-- Screen gui
local sg = Instance.new("ScreenGui")
sg.Name = "GrandNotifier"
sg.ResetOnSpawn = false
sg.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
sg.Parent = CoreGui

local WIN_W = 400
local WIN_H = 500

local main = Instance.new("Frame")
main.Name = "Main"
main.Size = UDim2.new(0, WIN_W, 0, WIN_H)
main.Position = UDim2.new(0.5, -WIN_W/2, 0.5, -WIN_H/2)
main.BackgroundColor3 = BG
main.BorderSizePixel = 0
main.ClipsDescendants = false
main.Parent = sg
Instance.new("UICorner", main).CornerRadius = UDim.new(0, 14)
local mainStroke = Instance.new("UIStroke", main)
mainStroke.Color = BORDER
mainStroke.Thickness = 1

-- Header
local header = Instance.new("Frame")
header.Name = "Header"
header.Size = UDim2.new(1, 0, 0, 58)
header.BackgroundColor3 = HDR_BG
header.BorderSizePixel = 0
header.Parent = main
Instance.new("UICorner", header).CornerRadius = UDim.new(0, 14)

-- Square off header bottom corners
local hFill = Instance.new("Frame")
hFill.Size = UDim2.new(1, 0, 0, 14)
hFill.Position = UDim2.new(0, 0, 1, -14)
hFill.BackgroundColor3 = HDR_BG
hFill.BorderSizePixel = 0
hFill.Parent = header

local hDiv = Instance.new("Frame")
hDiv.Size = UDim2.new(1, 0, 0, 1)
hDiv.Position = UDim2.new(0, 0, 1, -1)
hDiv.BackgroundColor3 = BORDER
hDiv.BorderSizePixel = 0
hDiv.Parent = header

-- Logo dot (purple)
local logoDot = Instance.new("Frame")
logoDot.Size = UDim2.new(0, 8, 0, 8)
logoDot.Position = UDim2.new(0, 16, 0, 16)
logoDot.BackgroundColor3 = PURPLE
logoDot.BorderSizePixel = 0
logoDot.Parent = header
Instance.new("UICorner", logoDot).CornerRadius = UDim.new(1, 0)

-- Title: GRAND
local grandLbl = Instance.new("TextLabel")
grandLbl.Size = UDim2.new(0, 120, 0, 18)
grandLbl.Position = UDim2.new(0, 30, 0, 8)
grandLbl.BackgroundTransparency = 1
grandLbl.Text = "GRAND"
grandLbl.TextColor3 = TXT_WHITE
grandLbl.TextSize = 17
grandLbl.Font = Enum.Font.GothamBold
grandLbl.TextXAlignment = Enum.TextXAlignment.Left
grandLbl.Parent = header

-- Subtitle: NOTIFIER (cyan/teal)
local notifierLbl = Instance.new("TextLabel")
notifierLbl.Size = UDim2.new(0, 120, 0, 18)
notifierLbl.Position = UDim2.new(0, 30, 0, 28)
notifierLbl.BackgroundTransparency = 1
notifierLbl.Text = "NOTIFIER"
notifierLbl.TextColor3 = CYAN
notifierLbl.TextSize = 16
notifierLbl.Font = Enum.Font.GothamBold
notifierLbl.TextXAlignment = Enum.TextXAlignment.Left
notifierLbl.Parent = header

-- Live indicator dot
local liveDot = Instance.new("Frame")
liveDot.Size = UDim2.new(0, 7, 0, 7)
liveDot.Position = UDim2.new(1, -110, 0.5, -3)
liveDot.BackgroundColor3 = CYAN
liveDot.BorderSizePixel = 0
liveDot.Parent = header
Instance.new("UICorner", liveDot).CornerRadius = UDim.new(1, 0)

local liveLbl = Instance.new("TextLabel")
liveLbl.Size = UDim2.new(0, 80, 0, 16)
liveLbl.Position = UDim2.new(1, -100, 0.5, -8)
liveLbl.BackgroundTransparency = 1
liveLbl.Text = "Live"
liveLbl.TextColor3 = CYAN
liveLbl.TextSize = 13
liveLbl.Font = Enum.Font.GothamBold
liveLbl.TextXAlignment = Enum.TextXAlignment.Left
liveLbl.Parent = header

-- Minimize button
local minimizeBtn = Instance.new("TextButton")
minimizeBtn.Size = UDim2.new(0, 28, 0, 28)
minimizeBtn.Position = UDim2.new(1, -38, 0.5, -14)
minimizeBtn.BackgroundColor3 = PURPLE_DIM
minimizeBtn.Text = "—"
minimizeBtn.TextColor3 = PURPLE
minimizeBtn.TextSize = 14
minimizeBtn.Font = Enum.Font.GothamBold
minimizeBtn.BorderSizePixel = 0
minimizeBtn.Parent = header
Instance.new("UICorner", minimizeBtn).CornerRadius = UDim.new(0, 7)
local minStroke = Instance.new("UIStroke", minimizeBtn)
minStroke.Color = BORDER
minStroke.Thickness = 1

-- Drag
local dragging, dragInput, dragStart, startPos
header.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = true
        dragStart = input.Position
        startPos = main.Position
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then dragging = false end
        end)
    end
end)
header.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement then dragInput = input end
end)
UserInput.InputChanged:Connect(function(input)
    if input == dragInput and dragging then
        local d = input.Position - dragStart
        main.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
    end
end)

-- Content
local content = Instance.new("Frame")
content.Size = UDim2.new(1, 0, 1, -58)
content.Position = UDim2.new(0, 0, 0, 58)
content.BackgroundTransparency = 1
content.BorderSizePixel = 0
content.Visible = true
content.Parent = main

-- Stats row
local statsRow = Instance.new("Frame")
statsRow.Size = UDim2.new(1, -24, 0, 48)
statsRow.Position = UDim2.new(0, 12, 0, 10)
statsRow.BackgroundTransparency = 1
statsRow.Parent = content

local sl = Instance.new("UIListLayout", statsRow)
sl.FillDirection = Enum.FillDirection.Horizontal
sl.SortOrder = Enum.SortOrder.LayoutOrder
sl.Padding = UDim.new(0, 6)

local SDEFS = {
    { key="total",      lbl="TOTAL",  col=PURPLE                        },
    { key="session",    lbl="SESSION",col=CYAN                          },
    { key="low",        lbl="15M+",   col=Color3.fromRGB(96,165,250)   },
    { key="high",       lbl="50M+",   col=Color3.fromRGB(167,139,250)  },
}
local statNums = {}

for i, s in ipairs(SDEFS) do
    local c = Instance.new("Frame")
    c.Size = UDim2.new(0.25, -5, 1, 0)
    c.BackgroundColor3 = CARD_BG
    c.BorderSizePixel = 0
    c.LayoutOrder = i
    c.Parent = statsRow
    Instance.new("UICorner", c).CornerRadius = UDim.new(0, 8)
    local cStroke = Instance.new("UIStroke", c)
    cStroke.Color = BORDER2
    cStroke.Thickness = 1

    local n = Instance.new("TextLabel", c)
    n.Size = UDim2.new(1,0,0,22)
    n.Position = UDim2.new(0,0,0,5)
    n.BackgroundTransparency = 1
    n.Text = "0"
    n.TextColor3 = s.col
    n.TextSize = 18
    n.Font = Enum.Font.GothamBold
    statNums[s.key] = n

    local l = Instance.new("TextLabel", c)
    l.Size = UDim2.new(1,0,0,12)
    l.Position = UDim2.new(0,0,0,28)
    l.BackgroundTransparency = 1
    l.Text = s.lbl
    l.TextColor3 = TXT_DIM
    l.TextSize = 10
    l.Font = Enum.Font.GothamBold
end

-- Tab bar
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1, -24, 0, 30)
tabBar.Position = UDim2.new(0, 12, 0, 66)
tabBar.BackgroundColor3 = CARD_BG
tabBar.BorderSizePixel = 0
tabBar.Parent = content
Instance.new("UICorner", tabBar).CornerRadius = UDim.new(0, 8)
local tabStroke = Instance.new("UIStroke", tabBar)
tabStroke.Color = BORDER2
tabStroke.Thickness = 1

local tabLayout = Instance.new("UIListLayout", tabBar)
tabLayout.FillDirection = Enum.FillDirection.Horizontal
tabLayout.SortOrder = Enum.SortOrder.LayoutOrder
tabLayout.Padding = UDim.new(0, 2)
local tp = Instance.new("UIPadding", tabBar)
tp.PaddingLeft  = UDim.new(0,3)
tp.PaddingRight = UDim.new(0,3)
tp.PaddingTop   = UDim.new(0,3)
tp.PaddingBottom = UDim.new(0,3)

local TABS = {"All","15M","50M","150M","1B"}
local tabBtns = {}
local currentFilter = "All"

for i, name in ipairs(TABS) do
    local t = Instance.new("TextButton")
    t.Size = UDim2.new(0.2, -2, 1, 0)
    t.BackgroundColor3 = i==1 and TAB_ON["All"].bg or CARD_BG
    t.BackgroundTransparency = i==1 and 0 or 1
    t.Text = name
    t.TextColor3 = i==1 and TAB_ON["All"].txt or TXT_DIM
    t.TextSize = 12
    t.Font = Enum.Font.GothamBold
    t.BorderSizePixel = 0
    t.LayoutOrder = i
    t.Parent = tabBar
    Instance.new("UICorner", t).CornerRadius = UDim.new(0, 6)
    tabBtns[name] = t
end

-- Search
local searchFrame = Instance.new("Frame")
searchFrame.Size = UDim2.new(1, -24, 0, 28)
searchFrame.Position = UDim2.new(0, 12, 0, 104)
searchFrame.BackgroundColor3 = CARD_BG
searchFrame.BorderSizePixel = 0
searchFrame.Parent = content
Instance.new("UICorner", searchFrame).CornerRadius = UDim.new(0, 8)
local searchStroke = Instance.new("UIStroke", searchFrame)
searchStroke.Color = BORDER2
searchStroke.Thickness = 1

local searchIcon = Instance.new("TextLabel", searchFrame)
searchIcon.Size = UDim2.new(0, 24, 1, 0)
searchIcon.Position = UDim2.new(0, 4, 0, 0)
searchIcon.BackgroundTransparency = 1
searchIcon.Text = "⌕"
searchIcon.TextColor3 = TXT_DIM
searchIcon.TextSize = 15
searchIcon.Font = Enum.Font.GothamBold

local searchBox = Instance.new("TextBox", searchFrame)
searchBox.Size = UDim2.new(1, -32, 1, 0)
searchBox.Position = UDim2.new(0, 26, 0, 0)
searchBox.BackgroundTransparency = 1
searchBox.Text = ""
searchBox.PlaceholderText = "search brainrots..."
searchBox.PlaceholderColor3 = TXT_DIM
searchBox.TextColor3 = TXT_BRIGHT
searchBox.TextSize = 13
searchBox.Font = Enum.Font.Gotham
searchBox.TextXAlignment = Enum.TextXAlignment.Left
searchBox.ClearTextOnFocus = false

local currentSearch = ""

-- Scroll
local scroll = Instance.new("ScrollingFrame")
scroll.Size = UDim2.new(1, -24, 1, -170)
scroll.Position = UDim2.new(0, 12, 0, 140)
scroll.BackgroundTransparency = 1
scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 3
scroll.ScrollBarImageColor3 = PURPLE
scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.Parent = content

local ll = Instance.new("UIListLayout", scroll)
ll.SortOrder = Enum.SortOrder.LayoutOrder
ll.Padding = UDim.new(0, 5)
local scrollPad = Instance.new("UIPadding", scroll)
scrollPad.PaddingBottom = UDim.new(0, 8)
scrollPad.PaddingTop = UDim.new(0, 2)

-- Footer
local footer = Instance.new("Frame")
footer.Size = UDim2.new(1, 0, 0, 26)
footer.Position = UDim2.new(0, 0, 1, -26)
footer.BackgroundColor3 = HDR_BG
footer.BorderSizePixel = 0
footer.Parent = content
Instance.new("UICorner", footer).CornerRadius = UDim.new(0, 14)

local statusLbl = Instance.new("TextLabel", footer)
statusLbl.Size = UDim2.new(1, -24, 1, 0)
statusLbl.Position = UDim2.new(0, 12, 0, 0)
statusLbl.BackgroundTransparency = 1
statusLbl.Text = "watching for brainrots..."
statusLbl.TextColor3 = TXT_DIM
statusLbl.TextSize = 12
statusLbl.Font = Enum.Font.Gotham
statusLbl.TextXAlignment = Enum.TextXAlignment.Left

-- Resize handle
local rh = Instance.new("TextButton")
rh.Size = UDim2.new(0, 16, 0, 16)
rh.Position = UDim2.new(1, -16, 0, 5)
rh.BackgroundColor3 = BORDER
rh.Text = ""
rh.BorderSizePixel = 0
rh.ZIndex = 2
rh.Parent = footer
Instance.new("UICorner", rh).CornerRadius = UDim.new(0, 4)

for r = 1, 2 do
    for c2 = 1, 2 do
        local d = Instance.new("Frame", rh)
        d.Size = UDim2.new(0, 2, 0, 2)
        d.Position = UDim2.new(0, 2+(c2-1)*5, 0, 2+(r-1)*5)
        d.BackgroundColor3 = TXT_DIM
        d.BorderSizePixel = 0
        Instance.new("UICorner", d).CornerRadius = UDim.new(1, 0)
    end
end

-- Helper functions
local function getImageUrl(brainrotName)
    local http = getHttp()
    if not http then return nil end
    local baseName = brainrotName:match("^%[.-%]%s*(.+)$") or brainrotName
    local ok, result = pcall(function()
        return http({
            Url = SUPABASE_URL .. "/rest/v1/brainrot-image-links?brainrot_name=eq."
                .. HttpService:UrlEncode(baseName) .. "&select=brainrot_imglink",
            Method = "GET",
            Headers = {
                ["apikey"] = SUPABASE_KEY,
                ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                ["Content-Type"] = "application/json"
            }
        })
    end)
    if ok and result then
        local data = HttpService:JSONDecode(result.Body)
        if data and #data > 0 then
            return data[1].brainrot_imglink
        end
    end
    return nil
end

-- Get user info from luarmor key
local cachedDiscordId = nil
local cachedUsername  = nil
local cachedUserId    = nil

local function getUserFromKey()
    if cachedDiscordId then return cachedDiscordId, cachedUsername, cachedUserId end

    local http = getHttp()
    if not http then return nil, nil, nil end

    local scriptKey = getgenv().script_key or script_key
    if not scriptKey then return nil, nil, nil end

    local ok, result = pcall(function()
        return http({
            Url = SUPABASE_URL .. "/rest/v1/users?luarmor_key=eq." .. scriptKey .. "&select=id,discord_id,username",
            Method = "GET",
            Headers = {
                ["apikey"] = SUPABASE_KEY,
                ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                ["Content-Type"] = "application/json"
            }
        })
    end)

    if ok and result then
        local data = HttpService:JSONDecode(result.Body)
        if data and #data > 0 then
            cachedDiscordId = data[1].discord_id
            cachedUsername  = data[1].username
            cachedUserId    = data[1].id
            return cachedDiscordId, cachedUsername, cachedUserId
        end
    end
    return nil, nil, nil
end

-- Parse value string like "$9/s", "$1.5K/s", "$150M/s", "$1B/s" → number
local function parseValue(str)
    if not str or str == "?" then return 0 end
    local num, suffix = str:match("%$([%d%.]+)([KkMmBb]?)")
    if not num then return 0 end
    local n = tonumber(num) or 0
    suffix = suffix:upper()
    if     suffix == "K" then n = n * 1000
    elseif suffix == "M" then n = n * 1000000
    elseif suffix == "B" then n = n * 1000000000
    end
    return math.floor(n)
end

-- Map raw_value string → in-game TIER key (for card display)
local function getTierKey(raw_value, rarity)
    if rarity and rarity:upper() == "OG" then return "og" end
    local v = parseValue(raw_value or "")
    if v >= 1000000000 then return "beyondbest" end
    if v >= 150000000  then return "big"         end
    if v >= 50000000   then return "high"        end
    return "low"
end

-- Map rarity + value/s → website DB tier
-- Returns nil if below threshold (don't log)
local function getDbTier(rarity, valuePerSec)
    if rarity and rarity:upper() == "OG" then return "og" end
    if valuePerSec >= 1000000000  then return "best"      end  -- 1B+
    if valuePerSec >= 150000000   then return "legendary"  end  -- 150M–1B
    if valuePerSec >= 50000000    then return "high"       end  -- 50M–150M
    return nil  -- below 50M, not logged
end

-- Send steal to database
local function sendStealToDatabase(info)
    local http = getHttp()
    if not http then return end

    local valuePerSec = parseValue(info.value)
    local tier = getDbTier(info.rarity, valuePerSec)

    if not tier then return end

    local discordId, username, userId = getUserFromKey()

    -- Insert into steals table (website stats, leaderboard, charts)
    if userId then
        task.spawn(function()
            local ok, result = pcall(function()
                return http({
                    Url = SUPABASE_URL .. "/rest/v1/steals",
                    Method = "POST",
                    Headers = {
                        ["apikey"]        = SUPABASE_KEY,
                        ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                        ["Content-Type"]  = "application/json",
                        ["Prefer"]        = "return=minimal"
                    },
                    Body = HttpService:JSONEncode({
                        user_id   = userId,
                        item_name = info.name,
                        tier      = tier,
                        amount    = valuePerSec,
                        mutation  = info.mutation ~= "None" and info.mutation or nil,
                        rarity    = info.rarity ~= "?" and info.rarity or nil,
                        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ")
                    })
                })
            end)
            _ = ok
        end)
    end

    -- Insert into brainrot-steals for full raw record
    task.spawn(function()
        pcall(function()
            http({
                Url = SUPABASE_URL .. "/rest/v1/brainrot-steals",
                Method = "POST",
                Headers = {
                    ["apikey"]        = SUPABASE_KEY,
                    ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                    ["Content-Type"]  = "application/json",
                    ["Prefer"]        = "return=minimal"
                },
                Body = HttpService:JSONEncode({
                    discord_id     = discordId or "unknown",
                    brainrot_name  = info.name,
                    brainrot_value = tostring(info.value),
                    mutation       = info.mutation,
                    rarity         = info.rarity,
                    price          = info.price
                })
            })
        end)
    end)
end

-- Steal webhook
local function sendStealWebhook(info)
    local http = getHttp()
    if not http then return end

    -- Same threshold as DB — only log steals worth 50M/s+ (or OG rarity)
    local valuePerSec = parseValue(info.value)
    local tier = getDbTier(info.rarity, valuePerSec)
    if not tier then return end

    local imageUrl = getImageUrl(info.name)
    local unixTime = os.time()
    local mutationText = info.mutation ~= "None" and info.mutation or "None"
    local _, discordId = getUserFromKey()
    local pingId = cachedDiscordId or "unknown"

    local embedBody = {
        content = "Stolen by: <@" .. pingId .. ">",
        embeds = {{
            title  = "🎯 Brainrot Stolen!",
            color  = 5763719,
            fields = {
                { name = "🐾 Name",     value = "**" .. info.name .. "**", inline = true  },
                { name = "💰 Value",    value = "**" .. info.value .. "**", inline = true  },
                { name = "✨ Mutation", value = mutationText,               inline = true  },
                { name = "⭐ Rarity",   value = info.rarity,                inline = true  },
                { name = "🏷️ Price",   value = info.price,                 inline = true  },
                { name = "🕐 Time",    value = "<t:" .. unixTime .. ":R>", inline = true  },
            },
            footer    = { text = "🤖 Grand Notifier • Steal Tracker • " },
            thumbnail = imageUrl and { url = imageUrl } or nil
        }}
    }

    local maxRetries = 3
    local retryCount = 0
    local success = false
    repeat
        local err
        success, err = pcall(function()
            http({
                Url     = STEAL_WEBHOOK,
                Method  = "POST",
                Headers = { ["Content-Type"] = "application/json" },
                Body    = HttpService:JSONEncode(embedBody)
            })
        end)
        if not success then
            retryCount = retryCount + 1
            task.wait(2)
        end
    until success or retryCount >= maxRetries
end

-- Session data (only brainrots found during this execution)
local sessionData   = {}
local lastSeenId    = 0

-- Create card
local function createCard(data, index)
    local tierKey = getTierKey(data.raw_value, data.rarity)
    local t = TIER[tierKey] or TIER.low

    local card = Instance.new("Frame")
    card.Size = UDim2.new(1, 0, 0, 74)
    card.BackgroundColor3 = CARD_BG
    card.BorderSizePixel = 0
    card.LayoutOrder = -index -- newest on top
    card.Name = "Card_" .. tostring(data.id)
    card.Parent = scroll
    Instance.new("UICorner", card).CornerRadius = UDim.new(0, 10)
    local cs = Instance.new("UIStroke", card)
    cs.Color = BORDER2
    cs.Thickness = 1

    -- Accent left bar
    local acc = Instance.new("Frame")
    acc.Size = UDim2.new(0, 3, 0.65, 0)
    acc.Position = UDim2.new(0, 0, 0.175, 0)
    acc.BackgroundColor3 = t.acc
    acc.BorderSizePixel = 0
    acc.Parent = card
    Instance.new("UICorner", acc).CornerRadius = UDim.new(0, 3)

    -- Tier badge
    local bdg = Instance.new("Frame")
    bdg.Size = UDim2.new(0, 36, 0, 16)
    bdg.Position = UDim2.new(0, 12, 0, 10)
    bdg.BackgroundColor3 = t.badge
    bdg.BorderSizePixel = 0
    bdg.Parent = card
    Instance.new("UICorner", bdg).CornerRadius = UDim.new(0, 4)

    local btxt = Instance.new("TextLabel", bdg)
    btxt.Size = UDim2.new(1,0,1,0)
    btxt.BackgroundTransparency = 1
    btxt.Text = t.label
    btxt.TextColor3 = t.txt
    btxt.TextSize = 10
    btxt.Font = Enum.Font.GothamBold

    -- Name
    local nameLbl = Instance.new("TextLabel")
    nameLbl.Size = UDim2.new(0, 210, 0, 20)
    nameLbl.Position = UDim2.new(0, 12, 0, 29)
    nameLbl.BackgroundTransparency = 1
    nameLbl.Text = data.name or "Unknown"
    nameLbl.TextColor3 = TXT_BRIGHT
    nameLbl.TextSize = 14
    nameLbl.Font = Enum.Font.GothamBold
    nameLbl.TextXAlignment = Enum.TextXAlignment.Left
    nameLbl.TextTruncate = Enum.TextTruncate.AtEnd
    nameLbl.Parent = card

    -- Value
    local valLbl = Instance.new("TextLabel")
    valLbl.Size = UDim2.new(0, 210, 0, 14)
    valLbl.Position = UDim2.new(0, 12, 0, 51)
    valLbl.BackgroundTransparency = 1
    valLbl.Text = data.raw_value or "?"
    valLbl.TextColor3 = TXT_MID
    valLbl.TextSize = 12
    valLbl.Font = Enum.Font.Gotham
    valLbl.TextXAlignment = Enum.TextXAlignment.Left
    valLbl.Parent = card

    -- Join button
    local jbtn = Instance.new("TextButton")
    jbtn.Size = UDim2.new(0, 88, 0, 28)
    jbtn.Position = UDim2.new(1, -100, 0.5, -14)
    jbtn.BackgroundColor3 = PURPLE_DIM
    jbtn.Text = "JOIN"
    jbtn.TextColor3 = PURPLE
    jbtn.TextSize = 10
    jbtn.Font = Enum.Font.GothamBold
    jbtn.BorderSizePixel = 0
    jbtn.Parent = card
    Instance.new("UICorner", jbtn).CornerRadius = UDim.new(0, 7)
    local jStroke = Instance.new("UIStroke", jbtn)
    jStroke.Color = BORDER
    jStroke.Thickness = 1

    jbtn.MouseButton1Click:Connect(function()
        if data.server_id then
            jbtn.Text = "..."
            jbtn.TextColor3 = CYAN

            local ok = pcall(function()
                TeleportSvc:TeleportToPlaceInstance(SAB_PLACE_ID, data.server_id, player)
            end)

            if not ok then
                -- Immediate pcall failure (bad args, etc.)
                jbtn.Text = "FAIL"
                jbtn.TextColor3 = Color3.fromRGB(239,68,68)
                task.wait(2)
                jbtn.Text = "JOIN"
                jbtn.TextColor3 = PURPLE
            else
                -- Teleport was initiated — reset after 6s if we're still here
                -- (server full / server gone failures are async and won't pcall-catch)
                task.delay(6, function()
                    if jbtn.Text == "..." then
                        jbtn.Text = "JOIN"
                        jbtn.TextColor3 = PURPLE
                    end
                end)
            end
        else
            jbtn.Text = "NO ID"
            task.wait(1.5)
            jbtn.Text = "JOIN"
        end
    end)

    -- Catch async teleport failures (server full, server gone, etc.)
    TeleportSvc.TeleportInitFailed:Connect(function(plr, result, msg)
        if plr == player and jbtn.Text == "..." then
            jbtn.Text = "FAIL"
            jbtn.TextColor3 = Color3.fromRGB(239,68,68)
            task.wait(2)
            jbtn.Text = "JOIN"
            jbtn.TextColor3 = PURPLE
        end
    end)
end

-- Render
local function tierMatchesFilter(tier, filter)
    if filter == "All" then return true end
    if filter == "15M"  then return tier == "low" end
    if filter == "50M"  then return tier == "high" end
    if filter == "150M" then return tier == "big" end
    if filter == "1B"   then return tier == "beyondbest" or tier == "og" end
    return false
end

local function clearCards()
    for _, c in pairs(scroll:GetChildren()) do
        if c:IsA("Frame") and c.Name:sub(1,5) == "Card_" then c:Destroy() end
    end
end

local function renderCards()
    clearCards()
    local query = currentSearch:lower()
    local count = 0
    for i, d in ipairs(sessionData) do
        local okTier   = tierMatchesFilter(getTierKey(d.raw_value, d.rarity), currentFilter)
        local okSearch = query == "" or (d.name and d.name:lower():find(query, 1, true))
        local okValue  = parseValue(d.raw_value or "") >= 15000000
        if okTier and okSearch and okValue then
            createCard(d, i)
            count = count + 1
        end
    end
    if count == 0 then
        statusLbl.Text = "no brainrots found this session yet..."
    else
        statusLbl.Text = count .. " brainrot(s) this session"
    end
    statusLbl.TextColor3 = TXT_DIM
end

local function updateStats()
    local c = { total=0, session=0, low=0, high=0 }
    for _, d in ipairs(sessionData) do
        if parseValue(d.raw_value or "") >= 15000000 then
            local tk = getTierKey(d.raw_value, d.rarity)
            c.total   = c.total + 1
            c.session = c.session + 1
            if tk == "low"  then c.low  = c.low  + 1 end
            if tk == "high" then c.high = c.high + 1 end
        end
    end
    statNums.total.Text   = tostring(c.total)
    statNums.session.Text = tostring(c.session)
    statNums.low.Text     = tostring(c.low)
    statNums.high.Text    = tostring(c.high)
end

-- Fetch new brainrots since session start (polls every 3 seconds)
local function fetchNewBrainrots()
    local http = getHttp()
    if not http then return end

    local url = SUPABASE_URL .. "/rest/v1/brainrots?select=*&order=id.asc&created_at=gte." 
        .. HttpService:UrlEncode(SESSION_START)

    if lastSeenId > 0 then
        url = SUPABASE_URL .. "/rest/v1/brainrots?select=*&order=id.asc&id=gt." .. lastSeenId
            .. "&created_at=gte." .. HttpService:UrlEncode(SESSION_START)
    end

    local ok, result = pcall(function()
        return http({
            Url = url,
            Method = "GET",
            Headers = {
                ["apikey"] = SUPABASE_KEY,
                ["Authorization"] = "Bearer " .. SUPABASE_KEY,
                ["Content-Type"] = "application/json"
            }
        })
    end)

    if ok and result then
        local body = result.Body or result.body or ""
        local pok, data = pcall(function() return HttpService:JSONDecode(body) end)
        if pok and type(data) == "table" and #data > 0 then
            local newCount = 0
            for _, d in ipairs(data) do
                table.insert(sessionData, 1, d) -- newest first
                if d.id > lastSeenId then
                    lastSeenId = d.id
                end
                newCount = newCount + 1
            end
            if newCount > 0 then
                renderCards()
                updateStats()
                statusLbl.Text = "+" .. newCount .. " new • " .. #sessionData .. " total this session"
                statusLbl.TextColor3 = CYAN
                task.delay(3, function()
                    statusLbl.Text = #sessionData .. " brainrot(s) this session"
                    statusLbl.TextColor3 = TXT_DIM
                end)
            end
        end
    end
end

-- Auto poll every 3 seconds
task.spawn(function()
    while true do
        fetchNewBrainrots()
        task.wait(3)
    end
end)

-- Tabs
for _, name in ipairs(TABS) do
    tabBtns[name].MouseButton1Click:Connect(function()
        currentFilter = name
        for _, n in ipairs(TABS) do
            tabBtns[n].BackgroundTransparency = 1
            tabBtns[n].TextColor3 = TXT_DIM
        end
        local tabCol = TAB_ON[name] or TAB_ON["All"]
        tabBtns[name].BackgroundColor3 = tabCol.bg
        tabBtns[name].BackgroundTransparency = 0
        tabBtns[name].TextColor3 = tabCol.txt
        renderCards()
    end)
end

-- Search
searchBox:GetPropertyChangedSignal("Text"):Connect(function()
    currentSearch = searchBox.Text
    renderCards()
end)

-- Minimize
local minimized = false
minimizeBtn.MouseButton1Click:Connect(function()
    minimized = not minimized
    if minimized then
        content.Visible = false
        rh.Visible = false
        main.Size = UDim2.new(0, WIN_W, 0, 58)
        minimizeBtn.Text = "+"
        notifierLbl.Text = #sessionData > 0 and (#sessionData .. " found") or "NOTIFIER"
    else
        content.Visible = true
        rh.Visible = true
        main.Size = UDim2.new(0, WIN_W, 0, WIN_H)
        minimizeBtn.Text = "—"
        notifierLbl.Text = "NOTIFIER"
    end
end)

-- Resize
local resizing, resizeStart, resizeStartSize = false, nil, nil
rh.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        resizing = true
        resizeStart = input.Position
        resizeStartSize = main.Size
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then resizing = false end
        end)
    end
end)
UserInput.InputChanged:Connect(function(input)
    if resizing and input.UserInputType == Enum.UserInputType.MouseMovement then
        local delta = input.Position - resizeStart
        local nw = math.max(320, resizeStartSize.X.Offset + delta.X)
        local nh = math.max(320, resizeStartSize.Y.Offset + delta.Y)
        WIN_W = nw
        WIN_H = nh
        main.Size = UDim2.new(0, nw, 0, nh)
    end
end)

-- Steal detector
local net = game:GetService("ReplicatedStorage"):WaitForChild("Packages"):WaitForChild("Net")
local lastStolenInfo = nil
local templateCache  = {}

local function updateCache()
    local debris = workspace:FindFirstChild("Debris")
    if not debris then return end
    for _, template in ipairs(debris:GetChildren()) do
        if template.Name == "FastOverheadTemplate" then
            local overhead = template:FindFirstChild("AnimalOverhead")
            if overhead then
                local displayName = overhead:FindFirstChild("DisplayName")
                local generation  = overhead:FindFirstChild("Generation")
                local mutation    = overhead:FindFirstChild("Mutation")
                local rarity      = overhead:FindFirstChild("Rarity")
                local price       = overhead:FindFirstChild("Price")
                local stolenLabel = overhead:FindFirstChild("Stolen")

                if displayName and displayName.ContentText ~= "" then
                    local existing = templateCache[template]
                    local mutationFinal = "None"
                    local isStolen = false

                    if mutation and mutation.Visible and mutation.ContentText ~= "" then
                        mutationFinal = mutation.ContentText
                    elseif existing and existing.mutation ~= "None" then
                        mutationFinal = existing.mutation
                    end

                    if stolenLabel and stolenLabel.Visible and stolenLabel.ContentText == "STOLEN" then
                        isStolen = true
                    elseif existing and existing.isStolen then
                        isStolen = existing.isStolen
                    end

                    templateCache[template] = {
                        name     = displayName.ContentText,
                        value    = generation and generation.ContentText or "?",
                        mutation = mutationFinal,
                        rarity   = rarity and rarity.ContentText or "?",
                        price    = price  and price.ContentText  or "?",
                        isStolen = isStolen,
                    }
                end
            end
        end
    end
    for template in pairs(templateCache) do
        if not template.Parent then templateCache[template] = nil end
    end
end

task.spawn(function()
    while true do
        updateCache()
        task.wait(0.1)
    end
end)

local function findBrainrot(targetName)
    local stolenMatch = nil
    local fallback    = nil
    for template, info in pairs(templateCache) do
        if info.name:lower() == targetName:lower() then
            if info.isStolen then
                stolenMatch = info
                info.isStolen = false
                break
            end
            fallback = info
        end
    end
    return stolenMatch or fallback
end

for _, v in pairs(net:GetChildren()) do
    if v:IsA("RemoteEvent") then
        v.OnClientEvent:Connect(function(msg, duration, sound)
            if type(msg) == "string" and sound == "Sounds.Sfx.Success" and msg:find("stole") then
                local name = msg:match(">(.+)<") or msg
                lastStolenInfo = findBrainrot(name)
                    or { name = name, value = "?", mutation = "None", rarity = "?", price = "?" }
            end
        end)

        v.OnClientEvent:Connect(function(...)
            if #{...} == 0 and lastStolenInfo then
                task.delay(0.1, function()
                    if not lastStolenInfo then return end
                    local i = lastStolenInfo

                    task.spawn(function()
                        sendStealToDatabase(i)
                        sendStealWebhook(i)
                    end)

                    lastStolenInfo = nil
                end)
            end
        end)
    end
end

statusLbl.Text = "watching for brainrots..."