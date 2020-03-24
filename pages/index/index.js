//index.js
//获取应用实例
const app = getApp()
const RSA = require('../../utils/rsa.js');
Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    motto: '正在获取验证码中...',
    tip: '刷新验证码',
    hasCode: false,
    userInfo: {},
    hasUserInfo: false,
    hasSignUp: true,
    time: 0,
    pubkey: [],
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
  },
  onReady: function() {
    var that = this;
    wx.request({
      url: 'http://localhost:3000/getrsakey',
      method: "GET",
      complete: function (res) {
        //var data = res.data.slice(1, res.data.length-2)
        var n = new RSA.BigInt(res.data.n);
        var e = new RSA.BigInt(res.data.e);
        var m = new RSA.BigInt("12345");
        var pubkey = [n, e];
        that.setData({
          pubkey: pubkey
        })
        that.toGetCode(pubkey);
      }
    })
    
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
  toGetCode(pubkey){
    var that = this;
    wx.login({
      success: res => {
        // 字符串编码转为assic数值
        console.log("小程序客户端获取公钥");
        console.log("n:", pubkey[0].toString())
        console.log("e:", pubkey[1].toString())
        console.log("加密前的code：", res.code)
        var code = RSA.ToAssic(res.code, pubkey[0].toString().length);
        console.log("字符串转数字后的code：", code);
        var c = RSA.encrypt(code, pubkey);
        console.log("加密后的code：", c)
        wx.request({
          url: 'http://localhost:3000/getcode',
          method: "POST",
          data: {
            code: c
          },
          complete: function(res){
            that.hasGetCode(res);
          }
        })
      }
    })
  },
  hasGetCode(res){
    var that = this;
    console.log(res.data)
      if (res.data.s != 0) {
        that.errSwitch(res.data);
        return;
      }
      
      if (+new Date() - res.data.time < 100000) {
        that.setData({
          motto: res.data.code,
          time: parseInt(100 - (+new Date() - res.data.time) / 1000),
          hasCode: true
        })
        that.setTime();
      }
  },
  refreshCode(){
    if(this.data.hasSignUp) {
      this.setData({
        motto: "正在获取验证码"
      })
      this.toGetCode(this.data.pubkey);
    }
    else {
      wx.navigateTo({
        url: '../signup/signup',
      })
    }
  },
  errSwitch(err){
    var s = err.s;
    switch(s) {
      case 1: {
        this.setData({
          hasSignUp: false,
          motto: "非注册用户",
          tip: "注册"
        })
      }
    }
  }
})
