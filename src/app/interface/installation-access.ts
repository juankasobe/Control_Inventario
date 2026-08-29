export type DeviceAccessStatus = 'pending' | 'approved' | 'revoked';

export interface DeviceAccessRecord {
  readonly uid: string;
  readonly label: string;
  readonly status: DeviceAccessStatus;
}

type AccessStateVariant<Status extends string, Uid extends string | null = string | null> = Readonly<{
  status: Status;
  uid: Uid;
  label?: string;
  instructions?: string;
  error?: string;
}>;

export type AccessState =
  | AccessStateVariant<'initializing'>
  | (AccessStateVariant<'pending', string> & Readonly<{ instructions: string }>)
  | (AccessStateVariant<'approved', string> & Readonly<{ label: string }>)
  | (AccessStateVariant<'revoked', string> & Readonly<{ instructions: string }>)
  | (AccessStateVariant<'unavailable'> & Readonly<{ instructions: string; error: string }>);
