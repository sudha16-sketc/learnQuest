import { GAME_STATES } from '@learnquest/shared';

const ALLOWED_TRANSITIONS = {
  [GAME_STATES.MENU]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.LEVEL_BRIEFING],
  [GAME_STATES.TOPIC_SELECTION]: [GAME_STATES.LOADING_QUESTIONS, GAME_STATES.LEVEL_BRIEFING, GAME_STATES.MENU],
  [GAME_STATES.LEVEL_BRIEFING]: [GAME_STATES.LOADING_QUESTIONS, GAME_STATES.TOPIC_SELECTION, GAME_STATES.MENU],
  [GAME_STATES.LOADING_QUESTIONS]: [GAME_STATES.PLAYING, GAME_STATES.TOPIC_SELECTION],
  [GAME_STATES.PLAYING]: [
    GAME_STATES.QUESTION_ACTIVE,
    GAME_STATES.LEVEL_COMPLETED,
    GAME_STATES.LEVEL_FAILED,
    GAME_STATES.PAUSED
  ],
  [GAME_STATES.QUESTION_ACTIVE]: [
    GAME_STATES.FEEDBACK,
    GAME_STATES.PAUSED
  ],
  [GAME_STATES.FEEDBACK]: [
    GAME_STATES.PLAYING,
    GAME_STATES.LEARNING_EXPLANATION,
    GAME_STATES.LEVEL_COMPLETED,
    GAME_STATES.LEVEL_FAILED
  ],
  [GAME_STATES.LEARNING_EXPLANATION]: [
    GAME_STATES.QUESTION_ACTIVE,
    GAME_STATES.PLAYING,
    GAME_STATES.LEVEL_FAILED
  ],
  [GAME_STATES.LEVEL_COMPLETED]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.LEVEL_BRIEFING, GAME_STATES.PLAYING, GAME_STATES.MENU],
  [GAME_STATES.LEVEL_FAILED]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.PLAYING, GAME_STATES.MENU],
  [GAME_STATES.PAUSED]: [GAME_STATES.PLAYING, GAME_STATES.QUESTION_ACTIVE, GAME_STATES.MENU]
};

export class GameStateMachine {
  constructor(initialState = GAME_STATES.MENU, onChange = null) {
    this.currentState = initialState;
    this.previousState = null;
    this.onChange = onChange;
  }

  getState() {
    return this.currentState;
  }

  canTransitionTo(nextState) {
    const allowed = ALLOWED_TRANSITIONS[this.currentState] || [];
    return allowed.includes(nextState);
  }

  transition(nextState) {
    if (!this.canTransitionTo(nextState)) {
      throw new Error(`Invalid state transition from ${this.currentState} to ${nextState}`);
    }
    this.previousState = this.currentState;
    this.currentState = nextState;
    if (typeof this.onChange === 'function') {
      this.onChange(this.currentState, this.previousState);
    }
    return this.currentState;
  }
}
