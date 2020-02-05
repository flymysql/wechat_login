//index.js
//获取应用实例
const app = getApp()
let socketOpen = false
let socketMsgQueue = []
wx.request({
  url: 'http://me.idealli.com',
  complete: function(d) {
    console.log(d)
  }
})
wx.connectSocket({
  url: 'wss://webstock.idealli.com:2020',
  header: {
    'content-type': 'application/json'
  },
  //protocols: ['protocol1']
})

wx.onSocketOpen(function (res) {
  socketOpen = true
  for (let i = 0; i < socketMsgQueue.length; i++) {
    sendSocketMessage(socketMsgQueue[i])
  }
  socketMsgQueue = []
})


Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    motto: '验证码过期',
    tip: '刷新验证码',
    hasCode: false,
    userInfo: {},
    hasUserInfo: false,
    hasSignUp: true,
    time: 0,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    var that = this;
    wx.onSocketMessage(function (res) {
      if (res.data.length == 1) {
        that.errSwitch(res.data);
        return;
      }
      var data = res.data.split('-')
      console.log(data)
      if (+new Date() - Number(data[1]) < 100000) {
        that.setData({
          motto: data[0],
          time: parseInt(100 - (+new Date() - Number(data[1])) / 1000),
          hasCode: true
        })
        that.setTime();
      }
    })
  },
  onReady: function() {
    this.toGetCode();
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  setTime(){
    var that = this;
    if (this.data.time <= 0) {
      this.setData({
        motto: "验证码过期",
        hasCode: false
      })
    } else {
      this.setData({
        time: this.data.time - 1
      })
      setTimeout(function(){
        that.setTime();
      }, 1000);
    }
  },
  sendSocketMessage(msg) {
    if(socketOpen) {
      wx.sendSocketMessage({
        data: msg
      })
    } else {
      socketMsgQueue.push(msg)
    }
  },
  toGetCode(){
    wx.login({
      success: res => {
      this.sendSocketMessage(res.code)
      }
    })
  },
  refreshCode(){
    if(this.data.hasSignUp) {
      this.toGetCode();
    }
    else {
      wx.navigateTo({
        url: '../signup/signup',
      })
    }
  },
  errSwitch(err){
    switch(err) {
      case "1": {
        this.setData({
          hasSignUp: false,
          motto: "非注册用户",
          tip: "注册"
        })
      }
    }
  }
})
