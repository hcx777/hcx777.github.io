(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/* global Fluid, CONFIG */

HTMLElement.prototype.wrap = function (wrapper) {
  this.parentNode.insertBefore(wrapper, this);
  this.parentNode.removeChild(this);
  wrapper.appendChild(this);
};
Fluid.plugins = {
  typing: function typing(text) {
    if (!('Typed' in window)) {
      return;
    }
    var typed = new window.Typed('#subtitle', {
      strings: ['  ', text + '&nbsp;'],
      cursorChar: CONFIG.typing.cursorChar,
      typeSpeed: CONFIG.typing.typeSpeed,
      loop: CONFIG.typing.loop
    });
    typed.stop();
    var subtitle = document.getElementById('subtitle');
    if (subtitle) {
      subtitle.innerText = '';
    }
    jQuery(document).ready(function () {
      typed.start();
    });
  },
  fancyBox: function fancyBox(selector) {
    if (!CONFIG.image_zoom.enable || !('fancybox' in jQuery)) {
      return;
    }
    jQuery(selector || '.markdown-body :not(a) > img, .markdown-body > img').each(function () {
      var $image = jQuery(this);
      var imageUrl = $image.attr('data-src') || $image.attr('src') || '';
      if (CONFIG.image_zoom.img_url_replace) {
        var rep = CONFIG.image_zoom.img_url_replace;
        var r1 = rep[0] || '';
        var r2 = rep[1] || '';
        if (r1) {
          if (/^re:/.test(r1)) {
            r1 = r1.replace(/^re:/, '');
            var reg = new RegExp(r1, 'gi');
            imageUrl = imageUrl.replace(reg, r2);
          } else {
            imageUrl = imageUrl.replace(r1, r2);
          }
        }
      }
      var $imageWrap = $image.wrap("\n        <a class=\"fancybox fancybox.image\" href=\"".concat(imageUrl, "\"\n          itemscope itemtype=\"http://schema.org/ImageObject\" itemprop=\"url\"></a>")).parent('a');
      if ($imageWrap.length !== 0) {
        if ($image.is('.group-image-container img')) {
          $imageWrap.attr('data-fancybox', 'group').attr('rel', 'group');
        } else {
          $imageWrap.attr('data-fancybox', 'default').attr('rel', 'default');
        }
        var imageTitle = $image.attr('title') || $image.attr('alt');
        if (imageTitle) {
          $imageWrap.attr('title', imageTitle).attr('data-caption', imageTitle);
        }
      }
    });
    jQuery.fancybox.defaults.hash = false;
    jQuery('.fancybox').fancybox({
      loop: true,
      helpers: {
        overlay: {
          locked: false
        }
      }
    });
  },
  imageCaption: function imageCaption(selector) {
    if (!CONFIG.image_caption.enable) {
      return;
    }
    jQuery(selector || ".markdown-body > p > img, .markdown-body > figure > img,\n      .markdown-body > p > a.fancybox, .markdown-body > figure > a.fancybox").each(function () {
      var $target = jQuery(this);
      var $figcaption = $target.next('figcaption');
      if ($figcaption.length !== 0) {
        $figcaption.addClass('image-caption');
      } else {
        var imageTitle = $target.attr('title') || $target.attr('alt');
        if (imageTitle) {
          $target.after("<figcaption aria-hidden=\"true\" class=\"image-caption\">".concat(imageTitle, "</figcaption>"));
        }
      }
    });
  },
  codeWidget: function codeWidget() {
    var enableLang = CONFIG.code_language.enable && CONFIG.code_language["default"];
    var enableCopy = CONFIG.copy_btn && 'ClipboardJS' in window;
    if (!enableLang && !enableCopy) {
      return;
    }
    function getBgClass(ele) {
      return Fluid.utils.getBackgroundLightness(ele) >= 0 ? 'code-widget-light' : 'code-widget-dark';
    }
    var copyTmpl = '';
    copyTmpl += '<div class="code-widget">';
    copyTmpl += 'LANG';
    copyTmpl += '</div>';
    jQuery('.markdown-body pre').each(function () {
      var $pre = jQuery(this);
      if ($pre.find('code.mermaid').length > 0) {
        return;
      }
      if ($pre.find('span.line').length > 0) {
        return;
      }
      var lang = '';
      if (enableLang) {
        lang = CONFIG.code_language["default"];
        if ($pre[0].children.length > 0 && $pre[0].children[0].classList.length >= 2 && $pre.children().hasClass('hljs')) {
          lang = $pre[0].children[0].classList[1];
        } else if ($pre[0].getAttribute('data-language')) {
          lang = $pre[0].getAttribute('data-language');
        } else if ($pre.parent().hasClass('sourceCode') && $pre[0].children.length > 0 && $pre[0].children[0].classList.length >= 2) {
          lang = $pre[0].children[0].classList[1];
          $pre.parent().addClass('code-wrapper');
        } else if ($pre.parent().hasClass('markdown-body') && $pre[0].classList.length === 0) {
          $pre.wrap('<div class="code-wrapper"></div>');
        }
        lang = lang.toUpperCase().replace('NONE', CONFIG.code_language["default"]);
      }
      $pre.append(copyTmpl.replace('LANG', lang).replace('code-widget">', getBgClass($pre[0]) + (enableCopy ? ' code-widget copy-btn" data-clipboard-snippet><i class="iconfont icon-copy"></i>' : ' code-widget">')));
      if (enableCopy) {
        var clipboard = new ClipboardJS('.copy-btn', {
          target: function target(trigger) {
            var nodes = trigger.parentNode.childNodes;
            for (var i = 0; i < nodes.length; i++) {
              if (nodes[i].tagName === 'CODE') {
                return nodes[i];
              }
            }
          }
        });
        clipboard.on('success', function (e) {
          e.clearSelection();
          e.trigger.innerHTML = e.trigger.innerHTML.replace('icon-copy', 'icon-success');
          setTimeout(function () {
            e.trigger.innerHTML = e.trigger.innerHTML.replace('icon-success', 'icon-copy');
          }, 2000);
        });
      }
    });
  }
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0aGVtZXMvZmx1aWQvc291cmNlL2pzL3BsdWdpbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUVBLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVMsT0FBTyxFQUFFO0VBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUM7RUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0VBQ2pDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQzNCLENBQUM7QUFFRCxLQUFLLENBQUMsT0FBTyxHQUFHO0VBRWQsTUFBTSxFQUFFLGdCQUFTLElBQUksRUFBRTtJQUNyQixJQUFJLEVBQUUsT0FBTyxJQUFJLE1BQU0sQ0FBQyxFQUFFO01BQUU7SUFBUTtJQUVwQyxJQUFJLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO01BQ3hDLE9BQU8sRUFBRSxDQUNQLElBQUksRUFDSixJQUFJLEdBQUcsUUFBUSxDQUNoQjtNQUNELFVBQVUsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVU7TUFDcEMsU0FBUyxFQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUztNQUNuQyxJQUFJLEVBQVEsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM1QixDQUFDLENBQUM7SUFDRixLQUFLLENBQUMsSUFBSSxFQUFFO0lBQ1osSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7SUFDbEQsSUFBSSxRQUFRLEVBQUU7TUFDWixRQUFRLENBQUMsU0FBUyxHQUFHLEVBQUU7SUFDekI7SUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVc7TUFDaEMsS0FBSyxDQUFDLEtBQUssRUFBRTtJQUNmLENBQUMsQ0FB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QyxPQUFPLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQztVQUM5RSxVQUFVLENBQUMsWUFBVztZQUNwQixDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQztVQUNoRixDQUFDLEVBQUUsSUFBSSxDQUFDO1FBQ1YsQ0FBQyxDQUFDO01BQ0o7SUFDRixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiBnbG9iYWwgRmx1aWQsIENPTkZJRyAqL1xuXG5IVE1MRWxlbWVudC5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uKHdyYXBwZXIpIHtcbiAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh3cmFwcGVyLCB0aGlzKTtcbiAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpO1xuICB3cmFwcGVyLmFwcGVuZENoaWxkKHRoaXMpO1xufTtcblxuRmx1aWQucGx1Z2lucyA9IHtcblxuICB0eXBpbmc6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICBpZiAoISgnVHlwZWQnIGluIHdpbmRvdykpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgdHlwZWQgPSBuZXcgd2luZG93LlR5cGVkKCcjc3VidGl0bGUnLCB7XG4gICAgICBzdHJpbmdzOiBbXG4gICAgICAgICcgICcsXG4gICAgICAgIHRleHQgKyAnJm5ic3A7J1xuICAgICAgXSxcbiAgICAgIGN1cnNvckNoYXI6IENPTkZJRy50eXBpbmcuY3Vyc29yQ2hhcixcbiAgICAgIHR5cGVTcGVlZCA6IENPTkZJRy50eXBpbmcudHlwZVNwZWVkLFxuICAgICAgbG9vcCAgICAgIDogQ09ORklHLnR5cGluZy5sb29wXG4gICAgfSk7XG4gICAgdHlwZWQuc3RvcCgpO1xuICAgIHZhciBzdWJ0aXRsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdWJ0aXRsZScpO1xuICAgIGlmIChzdWJ0aXRsZSkge1xuICAgICAgc3VidGl0bGUuaW5uZXJUZXh0ID0gJyc7XG4gICAgfVxuICAgIGpRdWVyeShkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgICB0eXBlZC5zdGFydCgpO1xuICAgIH0pO1xuICB9LFxuXG4gIGZhbmN5Qm94OiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIGlmICghQ09ORklHLmltYWdlX3pvb20uZW5hYmxlIHx8ICEoJ2ZhbmN5Ym94JyBpbiBqUXVlcnkpKSB7IHJldHVybjsgfVxuXG4gICAgalF1ZXJ5KHNlbGVjdG9yIHx8ICcubWFya2Rvd24tYm9keSA6bm90KGEpID4gaW1nLCAubWFya2Rvd24tYm9keSA+IGltZycpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGltYWdlID0galF1ZXJ5KHRoaXMpO1xuICAgICAgdmFyIGltYWdlVXJsID0gJGltYWdlLmF0dHIoJ2RhdGEtc3JjJykgfHwgJGltYWdlLmF0dHIoJ3NyYycpIHx8ICcnO1xuICAgICAgaWYgKENPTkZJRy5pbWFnZV96b29tLmltZ191cmxfcmVwbGFjZSkge1xuICAgICAgICB2YXIgcmVwID0gQ09ORklHLmltYWdlX3pvb20uaW1nX3VybF9yZXBsYWNlO1xuICAgICAgICB2YXIgcjEgPSByZXBbMF0gfHwgJyc7XG4gICAgICAgIHZhciByMiA9IHJlcFsxXSB8fCAnJztcbiAgICAgICAgaWYgKHIxKSB7XG4gICAgICAgICAgaWYgKC9ecmU6Ly50ZXN0KHIxKSkge1xuICAgICAgICAgICAgcjEgPSByMS5yZXBsYWNlKC9ecmU6LywgJycpO1xuICAgICAgICAgICAgdmFyIHJlZyA9IG5ldyBSZWdFeHAocjEsICdnaScpO1xuICAgICAgICAgICAgaW1hZ2VVcmwgPSBpbWFnZVVybC5yZXBsYWNlKHJlZywgcjIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbWFnZVVybCA9IGltYWdlVXJsLnJlcGxhY2UocjEsIHIyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciAkaW1hZ2VXcmFwID0gJGltYWdlLndyYXAoYFxuICAgICAgICA8YSBjbGFzcz1cImZhbmN5Ym94IGZhbmN5Ym94LmltYWdlXCIgaHJlZj1cIiR7aW1hZ2VVcmx9XCJcbiAgICAgICAgICBpdGVtc2NvcGUgaXRlbXR5cGU9XCJodHRwOi8vc2NoZW1hLm9yZy9JbWFnZU9iamVjdFwiIGl0ZW1wcm9wPVwidXJsXCI+PC9hPmBcbiAgICAgICkucGFyZW50KCdhJyk7XG4gICAgICBpZiAoJGltYWdlV3JhcC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgaWYgKCRpbWFnZS5pcygnLmdyb3VwLWltYWdlLWNvbnRhaW5lciBpbWcnKSkge1xuICAgICAgICAgICRpbWFnZVdyYXAuYXR0cignZGF0YS1mYW5jeWJveCcsICdncm91cCcpLmF0dHIoJ3JlbCcsICdncm91cCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRpbWFnZVdyYXAuYXR0cignZGF0YS1mYW5jeWJveCcsICdkZWZhdWx0JykuYXR0cigncmVsJywgJ2RlZmF1bHQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbWFnZVRpdGxlID0gJGltYWdlLmF0dHIoJ3RpdGxlJykgfHwgJGltYWdlLmF0dHIoJ2FsdCcpO1xuICAgICAgICBpZiAoaW1hZ2VUaXRsZSkge1xuICAgICAgICAgICRpbWFnZVdyYXAuYXR0cigndGl0bGUnLCBpbWFnZVRpdGxlKS5hdHRyKCdkYXRhLWNhcHRpb24nLCBpbWFnZVRpdGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgalF1ZXJ5LmZhbmN5Ym94LmRlZmF1bHRzLmhhc2ggPSBmYWxzZTtcbiAgICBqUXVlcnkoJy5mYW5jeWJveCcpLmZhbmN5Ym94KHtcbiAgICAgIGxvb3AgICA6IHRydWUsXG4gICAgICBoZWxwZXJzOiB7XG4gICAgICAgIG92ZXJsYXk6IHtcbiAgICAgICAgICBsb2NrZWQ6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICBpbWFnZUNhcHRpb246IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgaWYgKCFDT05GSUcuaW1hZ2VfY2FwdGlvbi5lbmFibGUpIHsgcmV0dXJuOyB9XG5cbiAgICBqUXVlcnkoc2VsZWN0b3IgfHwgYC5tYXJrZG93bi1ib2R5ID4gcCA+IGltZywgLm1hcmtkb3duLWJvZHkgPiBmaWd1cmUgPiBpbWcsXG4gICAgICAubWFya2Rvd24tYm9keSA+IHAgPiBhLmZhbmN5Ym94LCAubWFya2Rvd24tYm9keSA+IGZpZ3VyZSA+IGEuZmFuY3lib3hgKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICR0YXJnZXQgPSBqUXVlcnkodGhpcyk7XG4gICAgICB2YXIgJGZpZ2NhcHRpb24gPSAkdGFyZ2V0Lm5leHQoJ2ZpZ2NhcHRpb24nKTtcbiAgICAgIGlmICgkZmlnY2FwdGlvbi5sZW5ndGggIT09IDApIHtcbiAgICAgICAgJGZpZ2NhcHRpb24uYWRkQ2xhc3MoJ2ltYWdlLWNhcHRpb24nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpbWFnZVRpdGxlID0gJHRhcmdldC5hdHRyKCd0aXRsZScpIHx8ICR0YXJnZXQuYXR0cignYWx0Jyk7XG4gICAgICAgIGlmIChpbWFnZVRpdGxlKSB7XG4gICAgICAgICAgJHRhcmdldC5hZnRlcihgPGZpZ2NhcHRpb24gYXJpYS1oaWRkZW49XCJ0cnVlXCIgY2xhc3M9XCJpbWFnZS1jYXB0aW9uXCI+JHtpbWFnZVRpdGxlfTwvZmlnY2FwdGlvbj5gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIGNvZGVXaWRnZXQoKSB7XG4gICAgdmFyIGVuYWJsZUxhbmcgPSBDT05GSUcuY29kZV9sYW5ndWFnZS5lbmFibGUgJiYgQ09ORklHLmNvZGVfbGFuZ3VhZ2UuZGVmYXVsdDtcbiAgICB2YXIgZW5hYmxlQ29weSA9IENPTkZJRy5jb3B5X2J0biAmJiAnQ2xpcGJvYXJkSlMnIGluIHdpbmRvdztcbiAgICBpZiAoIWVuYWJsZUxhbmcgJiYgIWVuYWJsZUNvcHkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRCZ0NsYXNzKGVsZSkge1xuICAgICAgcmV0dXJuIEZsdWlkLnV0aWxzLmdldEJhY2tncm91bmRMaWdodG5lc3MoZWxlKSA+PSAwID8gJ2NvZGUtd2lkZ2V0LWxpZ2h0JyA6ICdjb2RlLXdpZGdldC1kYXJrJztcbiAgICB9XG5cbiAgICB2YXIgY29weVRtcGwgPSAnJztcbiAgICBjb3B5VG1wbCArPSAnPGRpdiBjbGFzcz1cImNvZGUtd2lkZ2V0XCI+JztcbiAgICBjb3B5VG1wbCArPSAnTEFORyc7XG4gICAgY29weVRtcGwgKz0gJzwvZGl2Pic7XG4gICAgalF1ZXJ5KCcubWFya2Rvd24tYm9keSBwcmUnKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRwcmUgPSBqUXVlcnkodGhpcyk7XG4gICAgICBpZiAoJHByZS5maW5kKCdjb2RlLm1lcm1haWQnKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICgkcHJlLmZpbmQoJ3NwYW4ubGluZScpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgbGFuZyA9ICcnO1xuXG4gICAgICBpZiAoZW5hYmxlTGFuZykge1xuICAgICAgICBsYW5nID0gQ09ORklHLmNvZGVfbGFuZ3VhZ2UuZGVmYXVsdDtcbiAgICAgICAgaWYgKCRwcmVbMF0uY2hpbGRyZW4ubGVuZ3RoID4gMCAmJiAkcHJlWzBdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5sZW5ndGggPj0gMiAmJiAkcHJlLmNoaWxkcmVuKCkuaGFzQ2xhc3MoJ2hsanMnKSkge1xuICAgICAgICAgIGxhbmcgPSAkcHJlWzBdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdFsxXTtcbiAgICAgICAgfSBlbHNlIGlmICgkcHJlWzBdLmdldEF0dHJpYnV0ZSgnZGF0YS1sYW5ndWFnZScpKSB7XG4gICAgICAgICAgbGFuZyA9ICRwcmVbMF0uZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmd1YWdlJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoJHByZS5wYXJlbnQoKS5oYXNDbGFzcygnc291cmNlQ29kZScpICYmICRwcmVbMF0uY2hpbGRyZW4ubGVuZ3RoID4gMCAmJiAkcHJlWzBdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdC5sZW5ndGggPj0gMikge1xuICAgICAgICAgIGxhbmcgPSAkcHJlWzBdLmNoaWxkcmVuWzBdLmNsYXNzTGlzdFsxXTtcbiAgICAgICAgICAkcHJlLnBhcmVudCgpLmFkZENsYXNzKCdjb2RlLXdyYXBwZXInKTtcbiAgICAgICAgfSBlbHNlIGlmICgkcHJlLnBhcmVudCgpLmhhc0NsYXNzKCdtYXJrZG93bi1ib2R5JykgJiYgJHByZVswXS5jbGFzc0xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgJHByZS53cmFwKCc8ZGl2IGNsYXNzPVwiY29kZS13cmFwcGVyXCI+PC9kaXY+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgbGFuZyA9IGxhbmcudG9VcHBlckNhc2UoKS5yZXBsYWNlKCdOT05FJywgQ09ORklHLmNvZGVfbGFuZ3VhZ2UuZGVmYXVsdCk7XG4gICAgICB9XG4gICAgICAkcHJlLmFwcGVuZChjb3B5VG1wbC5yZXBsYWNlKCdMQU5HJywgbGFuZykucmVwbGFjZSgnY29kZS13aWRnZXRcIj4nLFxuICAgICAgICBnZXRCZ0NsYXNzKCRwcmVbMF0pICsgKGVuYWJsZUNvcHkgPyAnIGNvZGUtd2lkZ2V0IGNvcHktYnRuXCIgZGF0YS1jbGlwYm9hcmQtc25pcHBldD48aSBjbGFzcz1cImljb25mb250IGljb24tY29weVwiPjwvaT4nIDogJyBjb2RlLXdpZGdldFwiPicpKSk7XG5cbiAgICAgIGlmIChlbmFibGVDb3B5KSB7XG4gICAgICAgIHZhciBjbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkSlMoJy5jb3B5LWJ0bicsIHtcbiAgICAgICAgICB0YXJnZXQ6IGZ1bmN0aW9uKHRyaWdnZXIpIHtcbiAgICAgICAgICAgIHZhciBub2RlcyA9IHRyaWdnZXIucGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICBpZiAobm9kZXNbaV0udGFnTmFtZSA9PT0gJ0NPREUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzW2ldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY2xpcGJvYXJkLm9uKCdzdWNjZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGUuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICBlLnRyaWdnZXIuaW5uZXJIVE1MID0gZS50cmlnZ2VyLmlubmVySFRNTC5yZXBsYWNlKCdpY29uLWNvcHknLCAnaWNvbi1zdWNjZXNzJyk7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGUudHJpZ2dlci5pbm5lckhUTUwgPSBlLnRyaWdnZXIuaW5uZXJIVE1MLnJlcGxhY2UoJ2ljb24tc3VjY2VzcycsICdpY29uLWNvcHknKTtcbiAgICAgICAgICB9LCAyMDAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG4iXX0=
