VERSION = "1.00"

var current_tab_id

/*
var LocalDB = function()
{
    var serialize = function(object)
    {
        var serialize_element = []
        for( var attr in object )
            serialize_element.push( attr + ':' + escape( object[attr] ) )
        return serialize_element.join(',')
    },

    deserialize = function(string)
    {
        var elem = {}
        if(string)
        {
            string.split(',').map( function(attr_val) { elem[ attr_val.split(':')[0] ] = unescape( attr_val.split(':')[1] ) } )
            return elem
        }
    }

    this.save_var = function(name, value)
    { 
        if( typeof(value) == 'object' )
            localStorage.setItem( name, serialize(value) )
        else
            localStorage.setItem(name, value)
        return value
    }

    this.get_var = function(name, is_object)
    {
        if(is_object)
            return deserialize( localStorage.getItem(name) )
        else
            return localStorage.getItem(name)
    }

    this.delete_var = function(name)
    {
        localStorage.setItem(name, null)
    }
}
*/

var Tab = function(host)
{
    this.id
    this.host = host
}

var Target = function(tab)
{
    this.host = tab.host
    this.tabs = [tab]
    this.settings = { user_field: null, password_field: null, submit_field: null, brute_interval: 5.0, dictionary: new Dictionary() }
    this.status = { is_attack: false, is_success: false }
    this.founded = []

    this.add = function(tab)
    {
        this.tabs.push(tab)
    }
    this.remove = function(tab)
    {
        for(var i = 0; i < this.tabs.length; i++)
            if( this.tabs[i].id == tab.id )
                this.tabs.splice(i, 1)
    }
    this.find = function(tab)
    {
        if(tab)
            for(var i = 0; i < this.tabs.length; i++)
                if( this.tabs[i].id == tab.id )
                    return this.tabs[i]
    }
}

var Tabs = function()
{
    this.tabs = []
    this.get = function(id)
    {
        for( var i = 0; i < this.tabs.length; i++ )
            if( this.tabs[i].id == id )
                return this.tabs[i]   
    }
    this.remove = function(tab)
    {
        for( var i = 0; i < this.tabs.length; i++ )
            if( this.tabs[i].id == tab.id )
                this.tabs.splice(i, 1)
    }
    this.push = function(tab)
    {
        var old_tab
        if( ( old_tab = this.get(tab.id) ) )
            this.remove( old_tab )
        this.tabs.push(tab)
    }
    this.find = function(host)
    {
        for( var i = 0; i < this.tabs.length; i++ )
            if( this.tabs[i].host == host )
                return this.tabs[i]
    }
    this.get_current_tab = function()
    {
        for( var i = 0; i < this.tabs.length; i++ )
            if( this.tabs[i].id == current_tab_id )
                return this.tabs[i]
    }
    this.forEach = function(callback)
    {
        for( var i = 0; i < this.tabs.length; i++ )
            callback( this.tabs[i], i, this.tabs )
    }
}

var Targets = function()
{
    this.targets = []
    this.push = function(target)
    {
        this.targets.push(target)
    }
    this.get = function(id)
    {
        for( var i = 0; i < this.targets.length; i++ )
            for( var j = 0; j < this.targets[i].tabs.length; j++ )
                if( this.targets[i].tabs[j].id == id )
                    return this.targets[i]
    }
    this.find = function(host)
    {
        for( var i = 0; i < this.targets.length; i++ )
            if( this.targets[i].host == host )
                return this.targets[i]
    }
    this.remove = function(target)
    {
        for( var i = 0; i < this.targets.length; i++ )
            if( this.targets[i].host == target.host )
            {
                this.targets.splice(i, 1)
                break
            }
    }
    this.get_current_target = function()
    {
        for( var i = 0; i < this.targets.length; i++ )
            for( var j = 0; j < this.targets[i].tabs.length; j++ )
                if( this.targets[i].tabs[j].id == current_tab_id )
                    return this.targets[i]
    }
    this.forEach = function(callback)
    {
        for( var i = 0; i < this.targets.length; i++ )
            callback( this.targets[i], i, this.targets )
    }
}

var Dictionary = function(wordlist)
{
    var wordlists = []

    this.offset = 0

    this.add_wordlist = function(wordlist)
    {
        wordlist.id = wordlists.length
        wordlists.push(wordlist)
        return this
    }

    this.get_wordlists = function()
    {
        return wordlists
    }

    this.get_wordlist = function(id)
    {
        for( var dict = 0; dict < wordlists.length; dict++ )
            if( wordlists[dict].id == id )
                return wordlists[dict]
    }

    this.del_wordlist = function(id)
    {
        for( var dict = 0; dict < wordlists.length; dict++ )
            if( wordlists[dict].id == id )
                wordlists.splice(dict, 1)
    }

    this.pop_creds = function()
    {
        var creds = this.get_current_creds()
        if(creds.user != null && creds.password != null)
            this.offset++
        return creds
    }

    this.get_current_creds = function()
    {
        var offset = 0
        for( var dict = 0; dict < wordlists.length; dict++ )
        {
            for( var i = 0; i < wordlists[dict].combo.length; i++ )
            {
                if( this.offset == offset )
                {
                    user = wordlists[dict].combo[i][0]
                    password = wordlists[dict].combo[i][1]
                    return { user: user, password: password }
                }
                offset++
            }

            if( wordlists[dict].users && wordlists[dict].passwords )
            {
                for(var i = 0; i < wordlists[dict].passwords.length; i++)
                {
                    for(var j = 0; j < wordlists[dict].users.length; j++)
                    {
                        if( this.offset == offset )
                        {
                            user = wordlists[dict].users[j]
                            password = wordlists[dict].passwords[i]
                            return { user: user, password: password }
                        }
                        offset++
                    }
                }
            }
        }
        return { user: null, password: null }
    }

    this.get_count = function()
    {
        var count = 0
        for( var dict = 0; dict < wordlists.length; dict++ )
        {
            for( var i = 0; i < wordlists[dict].combo.length; i++ )
                count++

            if( wordlists[dict].users && wordlists[dict].passwords )
                for(var i = 0; i < wordlists[dict].passwords.length; i++)            
                    for(var j = 0; j < wordlists[dict].users.length; j++)                    
                        count++
        }
        return count
    }

    if(wordlist)
        wordlists.push(wordlist)
}


var targets = new Targets()
var tabs = new Tabs()

var content_handlers = {
    page_ready: function(tabid, data)
    {
        var tab, target
        if(! ( tab = tabs.get(tabid) ) )
        {
            tab = new Tab(data.host)
            tab.id = tabid
            tabs.push( tab )
            //console.log( "+ new_tab: " + data.host )
        }
        else if( tab.host != data.host )
        {
            if( ( target = targets.find(tab.host) ) )
                target.remove(tab)
            tab.host = data.host
        }

        if( ( target = targets.find(data.host) ) && ! target.find(tabid) )
        {
            target.add(tab)
            //console.log("+ thread: " + tab.id)
        }
    },
    put_settings: function(tabid, data)
    {
        var target
        //console.log( JSON.stringify(data.setting) )
        if( ( target = window.targets.find(data.host) ) != null )
            target.settings = Object.assign(target.settings, data.setting)
    },
    put_status: function(tabid, data)
    {
        var target
        if( ( target = window.targets.find(data.host) ) != null )
            target.status = Object.assign(target.status, data.status)      
    },
    put_founded: function(tabid, data)
    {
        var target
        if( ( target = window.targets.find(data.host) ) != null )
            target.founded.push( data.founded )
    },
    wait_target: function(tabid)
    {
        var target = targets.get(tabid)
        if(target)
            return { settings: target.settings, status: target.status }   
    },
    get_creds: function(tabid)
    {
        var target = targets.get(tabid)
        if(target)
        {
            creds = target.settings.dictionary.pop_creds()
            //console.log( JSON.stringify(creds) )
            return creds
        }
    }
}


var create_target = function()
{
    //console.log( '+ new target: ' + tabs.get_current_tab().host )
    if(! targets.find( tabs.get_current_tab().host ) )
        targets.push( new Target( tabs.get_current_tab() ) )
}

var select_inputs = function(host)
{
    var target, tab
    if( ( target = targets.find(host) ) )
    {
        target.settings.user_field = null
        target.settings.password_field = null
        target.settings.submit_field = null
        if( ( tab = target.find( tabs.get_current_tab() ) ) )
            content_page_send_message( tab.id, { method: 'select_inputs', data: '' } )
        else
            content_page_send_message( target.tabs[0].id, { method: 'select_inputs', data: '' } )
    }
}

var highlight_inputs = function(host)
{
    var target, tab
    if( ( target = targets.find(host) ) )
    {
        if( ( tab = target.find( tabs.get_current_tab() ) ) )
            content_page_send_message( tab.id, { method: 'highlight_inputs', data: '' } )
        else
            content_page_send_message( target.tabs[0].id, { method: 'highlight_inputs', data: '' } )
    }
}

var open_dict_window = function(host)
{
    var target = targets.find(host)
    if(target)
        chrome.windows.create( {
            url: chrome.runtime.getURL("wordlist.html#" + target.tabs[0].id),
            type: "popup",
            width: 600,
            height: 300
        } )
}

var set_interval = function(host, interval)
{
    var target = targets.find(host)
    if(! target)
        return
    interval = parseFloat(interval)
    if(! isNaN(interval) )
        target.settings.brute_interval = interval
}

var set_offset = function(host, offset)
{
    var target = targets.find(host)
    if(! target)
        return
    offset = parseInt(offset)
    if(! isNaN(offset) )
        target.settings.dictionary.offset = offset
}

var start_brute = function(host)
{
    var target = targets.find(host)
    if(! target)
        return
    target.status.is_attack = true
    for(var i = 0; i < target.tabs.length; i++)
        content_page_send_message( target.tabs[i].id, { method: 'start_brute', data: '' } )
}

var pause_brute = function(host)
{
    targets.find(host).status.is_attack = false
}

var delete_brute = function(host)
{
    targets.remove( targets.find(host) )
}



function content_page_recv_message(obj, tabid)
{
    //console.log('bg.js content_page_recv_message( obj.method=' + obj.method + ', obj.data=' + JSON.stringify(obj.data) + ' )')
    if(obj)
        return content_handlers[ obj.method ]( tabid, obj.data )
}

function content_page_send_message(tabid, obj, callback)
{
    //console.log('bg.js content_page_send_message( tabid=' + tabid + ', obj.method=' + obj.method + ' )')
    chrome.tabs.sendMessage( tabid, obj, ( function(callback) { return function(response) { if(callback) callback(response) } } )(callback) )
}


window.onload = function()
{
    chrome.runtime.onMessage.addListener( function(obj, sender, sendResponse) {
        //console.log('bg.js chrome.runtime.onMessage()')
        sendResponse( content_page_recv_message(obj, sender.tab.id) )
    } )

    chrome.tabs.onActivated.addListener( function(info) {
        //console.log("tab " + info.tabId)
        current_tab_id = info.tabId
    } )
    
    chrome.tabs.onUpdated.addListener( function(tabid) {
        current_tab_id = tabid
    } )
    
    console.log("bg.js " + VERSION)
}