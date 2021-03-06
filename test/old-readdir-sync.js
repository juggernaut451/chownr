if (!process.getuid || !process.getgid) {
  throw new Error("Tests require getuid/getgid support")
}

const fs = require('fs')
const readdir = fs.readdir
fs.readdir = (path, options, cb) => readdir(path, cb || options)
const readdirSync = fs.readdirSync
fs.readdirSync = (path, options) => readdirSync(path)

var curUid = +process.getuid()
, curGid = +process.getgid()
, chownr = require("../")
, test = require("tap").test
, mkdirp = require("mkdirp")
, rimraf = require("rimraf")

// sniff the 'id' command for other groups that i can legally assign to
var exec = require("child_process").exec
, groups
, dirs = []

exec("id", function (code, output) {
  if (code) throw new Error("failed to run 'id' command")
  groups = output.trim().split("=")[3].split(",").map(function (s) {
    return parseInt(s, 10)
  }).filter(function (g) {
    return g !== curGid
  })

  // console.error([curUid, groups[0]], "uid, gid")

  rimraf("/tmp/chownr", function (er) {
    if (er) throw er
    var cnt = 5
    for (var i = 0; i < 5; i ++) {
      mkdirp(getDir(), then)
    }
    function then (er) {
      if (er) throw er
      if (-- cnt === 0) {
        runTest()
      }
    }
  })
})

function getDir () {
  var x = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
  var y = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
  var z = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
  var dir = "/tmp/chownr/" + [x,y,z].join("/")
  dirs.push(dir)
  return dir
}

function runTest () {
  test("should complete successfully", function (t) {
    // console.error("calling chownr", curUid, groups[0], typeof curUid, typeof groups[0])
    chownr.sync("/tmp/chownr", curUid, groups[0])
    t.end()
  })

  dirs.forEach(function (dir) {
    test("verify "+dir, function (t) {
      fs.stat(dir, function (er, st) {
        if (er) {
          t.ifError(er)
          return t.end()
        }
        t.equal(st.uid, curUid, "uid should be " + curUid)
        t.equal(st.gid, groups[0], "gid should be "+groups[0])
        t.end()
      })
    })
  })

  test("cleanup", function (t) {
    rimraf("/tmp/chownr/", function (er) {
      t.ifError(er)
      t.end()
    })
  })
}

