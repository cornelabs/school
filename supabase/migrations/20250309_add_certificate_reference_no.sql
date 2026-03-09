-- Add certificate_reference_no (Certifier publicId) for viewing credential at credsverse.com
alter table public.certificates
  add column if not exists certificate_reference_no text;
