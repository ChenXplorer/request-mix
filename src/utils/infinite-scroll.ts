import { Ref } from 'vue';
import { Feed } from '../types/options';
import { isSSR } from './index';
import throttle from 'lodash/throttle';

export const getStyle = function (element: HTMLElement, styleName: string): string {
  if (isSSR) return '';
  if (!element || !styleName) return '';
  if (styleName === 'float') {
    styleName = 'cssFloat';
  }
  try {
    const style = element.style[styleName];
    if (style) return style;
    const computed = document.defaultView?.getComputedStyle(element, '');
    return computed ? computed[styleName] : '';
  } catch (e) {
    return element.style[styleName];
  }
};

export const getOffsetTop = (el: HTMLElement) => {
  let offset = 0;
  let parent = el;

  while (parent) {
    offset += parent.offsetTop;
    parent = parent.offsetParent as HTMLElement;
  }

  return offset;
};

export const getOffsetTopDistance = (el: HTMLElement, containerEl: HTMLElement) => {
  return Math.abs(getOffsetTop(el) - getOffsetTop(containerEl));
};

export const isScroll = (el: HTMLElement, isVertical = true): RegExpMatchArray | null => {
  if (isSSR) return null;
  const determinedDirection = isVertical === null || isVertical === undefined;
  const overflow = determinedDirection
    ? getStyle(el, 'overflow')
    : isVertical
    ? getStyle(el, 'overflowY')
    : getStyle(el, 'overflowX');

  return overflow.match(/(scroll|auto|overlay)/);
};

const getScrollContainer = (el: HTMLElement, isVertical = true): Window | HTMLElement | undefined => {
  if (isSSR) return;

  let parent: HTMLElement = el;
  while (parent) {
    if ([window, document, document.body, document.documentElement].includes(parent)) {
      return window;
    }
    if (isScroll(parent, isVertical)) {
      return parent;
    }
    parent = parent.parentNode as HTMLElement;
  }
  return parent;
};

export const onScroll = (option: Partial<Feed>, cb: Function, loading: Ref<Boolean>) => {
  const el = option?.containerRef?.value?.$el || option?.containerRef?.value;

  const container = getScrollContainer(el);
  if (!container) return;
  const containerEl = container === window ? document.documentElement : (container as HTMLElement);
  let lastScrollTop = containerEl.scrollTop;
  const delay = option?.scrollThrottle || 200;

  // check full
  let observer: MutationObserver | null;
  const checkFull = () => {
    if (containerEl.scrollHeight <= containerEl.clientHeight) {
      if (!loading.value) {
        cb();
      }
    } else {
      observer?.disconnect();
      observer = null;
    }
  };
  if (option?.scrollCheckFull) {
    observer = new MutationObserver(throttle(checkFull, 50));
    observer.observe(el, { childList: true, subtree: true });
    checkFull();
  }

  // handle scroll
  const handleScroll = () => {
    const { clientHeight, scrollHeight, scrollTop } = containerEl;
    const delta = scrollTop - lastScrollTop;
    lastScrollTop = scrollTop;
    if (observer || delta < 0) return;
    let isTrigger = scrollHeight - (clientHeight + scrollTop) <= (option.loadingOffset || 100);
    if (container !== el) {
      const { clientTop, scrollHeight: sh } = el;
      const offsetTop = getOffsetTopDistance(el, containerEl);
      isTrigger = offsetTop + clientTop + sh - (clientHeight + scrollTop) <= (option.loadingOffset || 100);
    }
    if (isTrigger) {
      if (!loading.value) {
        cb();
      }
    }
  };

  const onScroll = throttle(handleScroll, delay);
  console.log(container);

  container.addEventListener('scroll', onScroll);
  return () => {
    container.removeEventListener('scroll', onScroll);
  };
};
