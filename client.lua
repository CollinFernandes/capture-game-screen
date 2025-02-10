-- this is just a test code, to see if it actually works.
---@class Client
---@return table
local function Client()
    local self = {}

    function self.commands()
        RegisterCommand('start', function()
            SendNUIMessage({ action = 'startVideo' })
        end, false)

        RegisterCommand('stop', function()
            SendNUIMessage({ action = 'stopVideo' })
        end, false)
    end

    function self.setup()
        self.commands()
    end

    return self
end

CreateThread(function()
    local clientInstance = Client()
    clientInstance.setup()
end)
