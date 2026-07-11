export type VeraSendAction = {
  action: 'send';
  body: string;
  cta: 'binary_yes_no' | 'binary_confirm_cancel' | 'open_ended' | 'binary_yes_no_stop' | string;
  rationale: string;
};

export type VeraWaitAction = {
  action: 'wait';
  wait_seconds: number;
  rationale: string;
};

export type VeraEndAction = {
  action: 'end';
  rationale: string;
};

export type VeraReplyAction = VeraSendAction | VeraWaitAction | VeraEndAction;

