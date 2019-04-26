import { bool } from '@ember/object/computed';
import { bind } from '@ember/runloop';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';
import { set, get, computed, getProperties } from '@ember/object';
import layout from '../../templates/components/nypr-player/progress-meter';
import {
  findTouchById,
  isSimulatedMouseEvent
} from '../../utils/touch-utils';
export default Component.extend({
  layout,
  isLoaded                : bool('duration'),
  isHovering              : false,
  isDragging              : false,
  isTouching              : false,
  classNames              : ['nypr-player-progress'],
  classNameBindings       : ['isHovering', 'isDragging', 'isTouching', 'isLoaded'],
  downloadedPercentage    : computed('downloaded', function() {
    let downloaded = get(this, 'downloaded');
    return htmlSafe(`width: ${(downloaded) * 100}%;`);
  }),
  playedPercentage        : computed('position', function() {
    let position = get(this, 'position');
    let duration = get(this, 'duration');
    return htmlSafe(`width: ${(position/duration) * 100}%;`);
  }),
  playheadPosition        : computed('isDragging', 'isTouching', 'handlePosition', 'position', 'duration', function() {
    let p;
    let {isDragging, isTouching, handlePosition, position, duration} =
      getProperties(this, 'isDragging', 'isTouching', 'handlePosition', 'position', 'duration');

    if (isDragging || isTouching) {
      p = handlePosition;
    } else {
      p = position/duration;
    }
    return htmlSafe(`left : ${p * 100}%;`);
  }),

  handlePosition          : 0,

  mouseDown(e) {
    // We only want left clicks
    let isLeftClick = e.which === 1;
    // Sometimes touch events which aren't defaultPrevented send
    // fake MouseEvents.  We handle TouchEvents separately so
    // we don't want these
    let isRealMouse = !isSimulatedMouseEvent(e.originalEvent);

    if (get(this, 'isLoaded') && isLeftClick && isRealMouse) {
      this._updateAudioPosition(e);
      if (e.target.classList.contains('js-nypr-player-progress-playhead')) {
        this._startDragging();
        // prevent dragging and selecting
        e.preventDefault();
      }
    }
  },
  mouseUp() {
    this._cancelDragging();
  },
  mouseEnter() {
    set(this, 'isHovering', true);
  },
  mouseMove(e) {
    if (!isSimulatedMouseEvent(e)) {
      // prevent dragging and selecting
      e.preventDefault();
      this._updateHandlePosition(e);
    }
  },
  mouseLeave() {
    set(this, 'isHovering', false);
    this._cancelDragging();
  },
  touchStart(e) {
    // prevent emulated mouse events
    e.preventDefault();
    if (get(this, 'isLoaded') && e.target.classList.contains('js-nypr-player-progress-playhead')) {
      let touch = e.originalEvent.changedTouches[0];
      this._updateAudioPosition(touch);
      set(this, 'isTouching', true);
      this._startDragging(touch);
    }
  },
  touchEnd(e) {
    // prevent emulated mouse events
    e.preventDefault();
    if (get(this, 'isLoaded') && e.target.classList.contains('js-nypr-player-progress-playhead')) {
      let touch = e.originalEvent.changedTouches[0];
      this._updateAudioPosition(touch);
      set(this, 'isTouching', false);
      this._cancelDragging();
    }
  },
  touchCancel(e) {
    // prevent emulated mouse events
    e.preventDefault();
    set(this, 'isTouching', false);
    this._cancelDragging();
  },
  _startDragging(touch) {
    set(this, 'isDragging', true);
    if (touch) {
      this.$().on('touchmove', bind(this, e => {
        // prevent touch scrolling
        e.preventDefault();
        let event = e.originalEvent;
        let movedTouch = findTouchById(event.touches, touch.identifier);
        if (movedTouch) {
          this._updateAudioPosition(movedTouch);
        }
      }));
    } else {
      this.$().on('mousemove', bind(this, e => {
        // prevent dragging and selecting
        e.preventDefault();
        this._updateAudioPosition(e);
      }));
    }
  },
  _cancelDragging() {
    set(this, 'isDragging', false);
    this.$().off('touchmove');
    this.$().off('mousemove');
  },
  _updateHandlePosition(event) {
    if (event.pageX) {
      let offset = this.$('.js-nypr-player-progress-bg').offset();
      let p;
      if (event.pageX < offset.left) {
        p = 0;
      } else if (event.pageX > offset.left + this.$('.js-nypr-player-progress-bg').width()) {
        p = 1;
      } else {
        p = (event.pageX - offset.left) / this.$('.js-nypr-player-progress-bg').width();
      }
      set(this, 'handlePosition', p);
      return p;
    }
  },
  _updateAudioPosition(event) {
    let p = this._updateHandlePosition(event);
    get(this, 'setPosition')(p);
  }
});
