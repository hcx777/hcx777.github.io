(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/* global CONFIG */
// eslint-disable-next-line no-console

(function (window, document) {
  // 查询存储的记录
  function getRecord(Counter, target) {
    return new Promise(function (resolve, reject) {
      Counter('get', '/classes/Counter?where=' + encodeURIComponent(JSON.stringify({
        target: target
      }))).then(function (resp) {
        return resp.json();
      }).then(function (_ref) {
        var results = _ref.results,
          code = _ref.code,
          error = _ref.error;
        if (code === 401) {
          throw error;
        }
        if (results && results.length > 0) {
          var record = results[0];
          resolve(record);
        } else {
          Counter('post', '/classes/Counter', {
            target: target,
            time: 0
          }).then(function (resp) {
            return resp.json();
          }).then(function (record, error) {
            if (error) {
              throw error;
            }
            resolve(record);
          })["catch"](function (error) {
            console.error('Failed to create: ', error);
            reject(error);
          });
        }
      })["catch"](function (error) {
        console.error('LeanCloud Counter Error: ', error);
        reject(error);
      });
    });
  }

  // 发起自增请求
  function increment(Counter, incrArr) {
    return new Promise(function (resolve, reject) {
      Counter('post', '/batch', {
        'requests': incrArr
      }).then(function (res) {
        res = res.json();
        if (res.error) {
          throw res.error;
        }
        resolve(res);
      })["catch"](function (error) {
        console.error('Failed to save visitor count: ', error);
        reject(error);
      });
    });
  }

  // 构建自增请求体
  function buildIncrement(objectId) {
    return {
      'method': 'PUT',
      'path': "/1.1/classes/Counter/".concat(objectId),
      'body': {
        'time': {
          '__op': 'Increment',
          'amount': 1
        }
      }
    };
  }

  // 校验是否为有效的 Host
  function validHost() {
    if (CONFIG.web_analytics.leancloud.ignore_local) {
      var hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }
    }
    return true;
  }

  // 校验是否为有效的 UV
  function validUV() {
    var key = 'LeanCloud_UV_Flag';
    var flag = localStorage.getItem(key);
    if (flag) {
      // 距离标记小于 24 小时则不计为 UV
      if (new Date().getTime() - parseInt(flag, 10) <= 86400000) {
        return false;
      }
    }
    localStorage.setItem(key, new Date().getTime().toString());
    return true;
  }
  function addCount(Counter) {
    var enableIncr = CONFIG.web_analytics.enable && !Fluid.ctx.dnt && validHost();
    var getterArr = [];
    var incrArr = [];

    // 请求 PV 并自增
    var pvCtn = document.querySelector('#leancloud-site-pv-container');
    if (pvCtn) {
      var pvGetter = getRecord(Counter, 'site-pv').then(function (record) {
        enableIncr && incrArr.push(buildIncrement(record.objectId));
        var ele = document.querySelector('#leancloud-site-pv');
        if (ele) {
          ele.innerText = (record.time || 0) + (enableIncr ? 1 : 0);
          pvCtn.style.display = 'inline';
        }
      });
      getterArr.push(pvGetter);
    }

    // 请求 UV 并自增
    var uvCtn = document.querySelector('#leancloud-site-uv-container');
    if (uvCtn) {
      var uvGetter = getRecord(Counter, 'site-uv').then(function (record) {
        var incrUV = validUV() && enableIncr;
        incrUV && incrArr.push(buildIncrement(record.objectId));
        var ele = document.querySelector('#leancloud-site-uv');
        if (ele) {
          ele.innerText = (record.time || 0) + (incrUV ? 1 : 0);
          uvCtn.style.display = 'inline';
        }
      });
      getterArr.push(uvGetter);
    }

    // 如果有页面浏览数节点，则请求浏览数并自增
    var viewCtn = document.querySelector('#leancloud-page-views-container');
    if (viewCtn) {
      var path = eval(CONFIG.web_analytics.leancloud.path || 'window.location.pathname');
      var target = decodeURI(path.replace(/\/*(index.html)?$/, '/'));
      var viewGetter = getRecord(Counter, target).then(function (record) {
        enableIncr && incrArr.push(buildIncrement(record.objectId));
        var ele = document.querySelector('#leancloud-page-views');
        if (ele) {
          ele.innerText = (record.time || 0) + (enableIncr ? 1 : 0);
          viewCtn.style.display = 'inline';
        }
      });
      getterArr.push(viewGetter);
    }

    // 如果启动计数自增，批量发起自增请求
    if (enableIncr) {
      Promise.all(getterArr).then(function () {
        incrArr.length > 0 && increment(Counter, incrArr);
      });
    }
  }
  var appId = CONFIG.web_analytics.leancloud.app_id;
  var appKey = CONFIG.web_analytics.leancloud.app_key;
  var serverUrl = CONFIG.web_analytics.leancloud.server_url;
  if (!appId) {
    throw new Error('LeanCloud appId is empty');
  }
  if (!appKey) {
    throw new Error('LeanCloud appKey is empty');
  }
  function fetchData(api_server) {
    var Counter = function Counter(method, url, data) {
      return fetch("".concat(api_server, "/1.1").concat(url), {
        method: method,
        headers: {
          'X-LC-Id': appId,
          'X-LC-Key': appKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    };
    addCount(Counter);
  }
  var apiServer = serverUrl || "https://".concat(appId.slice(0, 8).toLowerCase(), ".api.lncldglobal.com");
  if (apiServer) {
    fetchData(apiServer);
  } else {
    fetch('https://app-router.leancloud.cn/2/route?appId=' + appId).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      if (data.api_server) {
        fetchData('https://' + data.api_server);
      }
    });
  }
})(window, document);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0aGVtZXMvZmx1aWQvc291cmNlL2pzL2xlYW5jbG91ZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7QUFDQTs7QUFFQSxDQUFDLFVBQVMsTUFBTSxFQUFFLFFBQVEsRUFBRTtFQUMxQjtFQUNBLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7SUFDbEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFTLE9BQU8sRUFBRSxNQUFNLEVBQUU7TUFDM0MsT0FBTyxDQUFDLEtBQUssRUFBRSx5QkFBeUIsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQUUsTUFBTSxFQUFOO01BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN2RixJQUFJLENBQUMsVUFBQSxJQUFJO1FBQUEsT0FBSSxJQUFJLENBQUMsSUFBSSxFQUFFO01BQUEsRUFBQyxDQUN6QixJQUFJLENBQUMsZ0JBQThCO1FBQUEsSUFBM0IsT0FBTyxRQUFQLE9BQU87VUFBRSxJQUFJLFFBQUosSUFBSTtVQUFFLEtBQUssUUFBTCxLQUFLO1FBQzNCLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtVQUNoQixNQUFNLEtBQUs7UUFDYjtRQUNBLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1VBQ2pDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDdkIsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNqQixDQUFDLE1BQU07VUFDTCxPQUFPLENBQUMsTUFBTSxFQUFFLGtCQUFrQixFQUFFO1lBQUUsTUFBTSxFQUFOLE1BQU07WUFBRSxJQUFJLEVBQUU7VUFBRSxDQUFDLENBQUMsQ0FDckQsSUFBSSxDQUFDLFVBQUEsSUFBSTtZQUFBLE9BQUksSUFBSSxDQUFDLElBQUksRUFBRTtVQUFBLEVBQUMsQ0FDekIsSUFBSSxDQUFDLFVBQUMs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TUFBQSxPQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFBQSxFQUFDLENBQ3pCLElBQUksQ0FBQyxVQUFDLElBQUksRUFBSztNQUNkLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNuQixTQUFTLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7TUFDekM7SUFDRixDQUFDLENBQUM7RUFDTjtBQUNGLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLyogZ2xvYmFsIENPTkZJRyAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcblxuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcbiAgLy8g5p+l6K+i5a2Y5YKo55qE6K6w5b2VXG4gIGZ1bmN0aW9uIGdldFJlY29yZChDb3VudGVyLCB0YXJnZXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBDb3VudGVyKCdnZXQnLCAnL2NsYXNzZXMvQ291bnRlcj93aGVyZT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KHsgdGFyZ2V0IH0pKSlcbiAgICAgICAgLnRoZW4ocmVzcCA9PiByZXNwLmpzb24oKSlcbiAgICAgICAgLnRoZW4oKHsgcmVzdWx0cywgY29kZSwgZXJyb3IgfSkgPT4ge1xuICAgICAgICAgIGlmIChjb2RlID09PSA0MDEpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciByZWNvcmQgPSByZXN1bHRzWzBdO1xuICAgICAgICAgICAgcmVzb2x2ZShyZWNvcmQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb3VudGVyKCdwb3N0JywgJy9jbGFzc2VzL0NvdW50ZXInLCB7IHRhcmdldCwgdGltZTogMCB9KVxuICAgICAgICAgICAgICAudGhlbihyZXNwID0+IHJlc3AuanNvbigpKVxuICAgICAgICAgICAgICAudGhlbigocmVjb3JkLCBlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVjb3JkKTtcbiAgICAgICAgICAgICAgfSkuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGU6ICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0xlYW5DbG91ZCBDb3VudGVyIEVycm9yOiAnLCBlcnJvcik7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyDlj5Hotbfoh6rlop7or7fmsYJcbiAgZnVuY3Rpb24gaW5jcmVtZW50KENvdW50ZXIsIGluY3JBcnIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBDb3VudGVyKCdwb3N0JywgJy9iYXRjaCcsIHtcbiAgICAgICAgJ3JlcXVlc3RzJzogaW5jckFyclxuICAgICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgIHJlcyA9IHJlcy5qc29uKCk7XG4gICAgICAgIGlmIChyZXMuZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyByZXMuZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShyZXMpO1xuICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHZpc2l0b3IgY291bnQ6ICcsIGVycm9yKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8g5p6E5bu66Ieq5aKe6K+35rGC5L2TXG4gIGZ1bmN0aW9uIGJ1aWxkSW5jcmVtZW50KG9iamVjdElkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdtZXRob2QnOiAnUFVUJyxcbiAgICAgICdwYXRoJyAgOiBgLzEuMS9jbGFzc2VzL0NvdW50ZXIvJHtvYmplY3RJZH1gLFxuICAgICAgJ2JvZHknICA6IHtcbiAgICAgICAgJ3RpbWUnOiB7XG4gICAgICAgICAgJ19fb3AnICA6ICdJbmNyZW1lbnQnLFxuICAgICAgICAgICdhbW91bnQnOiAxXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8g5qCh6aqM5piv5ZCm5Li65pyJ5pWI55qEIEhvc3RcbiAgZnVuY3Rpb24gdmFsaWRIb3N0KCkge1xuICAgIGlmIChDT05GSUcud2ViX2FuYWx5dGljcy5sZWFuY2xvdWQuaWdub3JlX2xvY2FsKSB7XG4gICAgICB2YXIgaG9zdG5hbWUgPSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWU7XG4gICAgICBpZiAoaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnIHx8IGhvc3RuYW1lID09PSAnMTI3LjAuMC4xJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8g5qCh6aqM5piv5ZCm5Li65pyJ5pWI55qEIFVWXG4gIGZ1bmN0aW9uIHZhbGlkVVYoKSB7XG4gICAgdmFyIGtleSA9ICdMZWFuQ2xvdWRfVVZfRmxhZyc7XG4gICAgdmFyIGZsYWcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIGlmIChmbGFnKSB7XG4gICAgICAvLyDot53nprvmoIforrDlsI/kuo4gMjQg5bCP5pe25YiZ5LiN6K6h5Li6IFVWXG4gICAgICBpZiAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBwYXJzZUludChmbGFnLCAxMCkgPD0gODY0MDAwMDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkQ291bnQoQ291bnRlcikge1xuICAgIHZhciBlbmFibGVJbmNyID0gQ09ORklHLndlYl9hbmFseXRpY3MuZW5hYmxlICYmICFGbHVpZC5jdHguZG50ICYmIHZhbGlkSG9zdCgpO1xuICAgIHZhciBnZXR0ZXJBcnIgPSBbXTtcbiAgICB2YXIgaW5jckFyciA9IFtdO1xuXG4gICAgLy8g6K+35rGCIFBWIOW5tuiHquWinlxuICAgIHZhciBwdkN0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWFuY2xvdWQtc2l0ZS1wdi1jb250YWluZXInKTtcbiAgICBpZiAocHZDdG4pIHtcbiAgICAgIHZhciBwdkdldHRlciA9IGdldFJlY29yZChDb3VudGVyLCAnc2l0ZS1wdicpLnRoZW4oKHJlY29yZCkgPT4ge1xuICAgICAgICBlbmFibGVJbmNyICYmIGluY3JBcnIucHVzaChidWlsZEluY3JlbWVudChyZWNvcmQub2JqZWN0SWQpKTtcbiAgICAgICAgdmFyIGVsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWFuY2xvdWQtc2l0ZS1wdicpO1xuICAgICAgICBpZiAoZWxlKSB7XG4gICAgICAgICAgZWxlLmlubmVyVGV4dCA9IChyZWNvcmQudGltZSB8fCAwKSArIChlbmFibGVJbmNyID8gMSA6IDApO1xuICAgICAgICAgIHB2Q3RuLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBnZXR0ZXJBcnIucHVzaChwdkdldHRlcik7XG4gICAgfVxuXG4gICAgLy8g6K+35rGCIFVWIOW5tuiHquWinlxuICAgIHZhciB1dkN0biA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWFuY2xvdWQtc2l0ZS11di1jb250YWluZXInKTtcbiAgICBpZiAodXZDdG4pIHtcbiAgICAgIHZhciB1dkdldHRlciA9IGdldFJlY29yZChDb3VudGVyLCAnc2l0ZS11dicpLnRoZW4oKHJlY29yZCkgPT4ge1xuICAgICAgICB2YXIgaW5jclVWID0gdmFsaWRVVigpICYmIGVuYWJsZUluY3I7XG4gICAgICAgIGluY3JVViAmJiBpbmNyQXJyLnB1c2goYnVpbGRJbmNyZW1lbnQocmVjb3JkLm9iamVjdElkKSk7XG4gICAgICAgIHZhciBlbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVhbmNsb3VkLXNpdGUtdXYnKTtcbiAgICAgICAgaWYgKGVsZSkge1xuICAgICAgICAgIGVsZS5pbm5lclRleHQgPSAocmVjb3JkLnRpbWUgfHwgMCkgKyAoaW5jclVWID8gMSA6IDApO1xuICAgICAgICAgIHV2Q3RuLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBnZXR0ZXJBcnIucHVzaCh1dkdldHRlcik7XG4gICAgfVxuXG4gICAgLy8g5aaC5p6c5pyJ6aG16Z2i5rWP6KeI5pWw6IqC54K577yM5YiZ6K+35rGC5rWP6KeI5pWw5bm26Ieq5aKeXG4gICAgdmFyIHZpZXdDdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVhbmNsb3VkLXBhZ2Utdmlld3MtY29udGFpbmVyJyk7XG4gICAgaWYgKHZpZXdDdG4pIHtcbiAgICAgIHZhciBwYXRoID0gZXZhbChDT05GSUcud2ViX2FuYWx5dGljcy5sZWFuY2xvdWQucGF0aCB8fCAnd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lJyk7XG4gICAgICB2YXIgdGFyZ2V0ID0gZGVjb2RlVVJJKHBhdGgucmVwbGFjZSgvXFwvKihpbmRleC5odG1sKT8kLywgJy8nKSk7XG4gICAgICB2YXIgdmlld0dldHRlciA9IGdldFJlY29yZChDb3VudGVyLCB0YXJnZXQpLnRoZW4oKHJlY29yZCkgPT4ge1xuICAgICAgICBlbmFibGVJbmNyICYmIGluY3JBcnIucHVzaChidWlsZEluY3JlbWVudChyZWNvcmQub2JqZWN0SWQpKTtcbiAgICAgICAgdmFyIGVsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWFuY2xvdWQtcGFnZS12aWV3cycpO1xuICAgICAgICBpZiAoZWxlKSB7XG4gICAgICAgICAgZWxlLmlubmVyVGV4dCA9IChyZWNvcmQudGltZSB8fCAwKSArIChlbmFibGVJbmNyID8gMSA6IDApO1xuICAgICAgICAgIHZpZXdDdG4uc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGdldHRlckFyci5wdXNoKHZpZXdHZXR0ZXIpO1xuICAgIH1cblxuICAgIC8vIOWmguaenOWQr+WKqOiuoeaVsOiHquWinu+8jOaJuemHj+WPkei1t+iHquWinuivt+axglxuICAgIGlmIChlbmFibGVJbmNyKSB7XG4gICAgICBQcm9taXNlLmFsbChnZXR0ZXJBcnIpLnRoZW4oKCkgPT4ge1xuICAgICAgICBpbmNyQXJyLmxlbmd0aCA+IDAgJiYgaW5jcmVtZW50KENvdW50ZXIsIGluY3JBcnIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGFwcElkID0gQ09ORklHLndlYl9hbmFseXRpY3MubGVhbmNsb3VkLmFwcF9pZDtcbiAgdmFyIGFwcEtleSA9IENPTkZJRy53ZWJfYW5hbHl0aWNzLmxlYW5jbG91ZC5hcHBfa2V5O1xuICB2YXIgc2VydmVyVXJsID0gQ09ORklHLndlYl9hbmFseXRpY3MubGVhbmNsb3VkLnNlcnZlcl91cmw7XG5cbiAgaWYgKCFhcHBJZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignTGVhbkNsb3VkIGFwcElkIGlzIGVtcHR5Jyk7XG4gIH1cbiAgaWYgKCFhcHBLZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0xlYW5DbG91ZCBhcHBLZXkgaXMgZW1wdHknKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZldGNoRGF0YShhcGlfc2VydmVyKSB7XG4gICAgdmFyIENvdW50ZXIgPSAobWV0aG9kLCB1cmwsIGRhdGEpID0+IHtcbiAgICAgIHJldHVybiBmZXRjaChgJHthcGlfc2VydmVyfS8xLjEke3VybH1gLCB7XG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdYLUxDLUlkJyAgICAgOiBhcHBJZCxcbiAgICAgICAgICAnWC1MQy1LZXknICAgIDogYXBwS2V5LFxuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhZGRDb3VudChDb3VudGVyKTtcbiAgfVxuXG4gIHZhciBhcGlTZXJ2ZXIgPSBzZXJ2ZXJVcmwgfHwgYGh0dHBzOi8vJHthcHBJZC5zbGljZSgwLCA4KS50b0xvd2VyQ2FzZSgpfS5hcGkubG5jbGRnbG9iYWwuY29tYDtcblxuICBpZiAoYXBpU2VydmVyKSB7XG4gICAgZmV0Y2hEYXRhKGFwaVNlcnZlcik7XG4gIH0gZWxzZSB7XG4gICAgZmV0Y2goJ2h0dHBzOi8vYXBwLXJvdXRlci5sZWFuY2xvdWQuY24vMi9yb3V0ZT9hcHBJZD0nICsgYXBwSWQpXG4gICAgICAudGhlbihyZXNwID0+IHJlc3AuanNvbigpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGRhdGEuYXBpX3NlcnZlcikge1xuICAgICAgICAgIGZldGNoRGF0YSgnaHR0cHM6Ly8nICsgZGF0YS5hcGlfc2VydmVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cbn0pKHdpbmRvdywgZG9jdW1lbnQpO1xuIl19
