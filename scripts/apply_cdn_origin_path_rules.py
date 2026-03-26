#!/usr/bin/env python3
"""
Apply Tencent Cloud CDN origin path rewrite rules (Origin.PathRules) via API.

Modes:
- plan  : print diff only
- apply : call UpdateDomainConfig
"""

import argparse
import json
import os
import sys
from copy import deepcopy

from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.cdn.v20180606 import cdn_client, models


def _load_rules(path):
  with open(path, 'r', encoding='utf-8') as f:
    rules = json.load(f)
  if not isinstance(rules, list):
    raise ValueError('rules file must be a JSON array')
  for i, r in enumerate(rules):
    if not isinstance(r, dict):
      raise ValueError(f'rule[{i}] must be object')
    for k in ('Regex', 'Path', 'ForwardUri'):
      if k not in r:
        raise ValueError(f'rule[{i}] missing key: {k}')
    if not str(r['ForwardUri']).startswith('/'):
      raise ValueError(f'rule[{i}] ForwardUri must start with /')
  return rules


def _client(secret_id, secret_key):
  cred = credential.Credential(secret_id, secret_key)
  return cdn_client.CdnClient(cred, '')


def _describe_domain(client, domain):
  req = models.DescribeDomainsConfigRequest()
  req.from_json_string(json.dumps({'Filters': [{'Name': 'domain', 'Value': [domain]}]}))
  resp = client.DescribeDomainsConfig(req)
  data = json.loads(resp.to_json_string())
  domains = data.get('Domains', [])
  if not domains:
    raise RuntimeError(f'Domain not found: {domain}')
  return domains[0]


def _normalize_rule(rule):
  r = {
    'Regex': bool(rule.get('Regex', False)),
    'Path': str(rule['Path']),
    'ForwardUri': str(rule['ForwardUri']),
  }
  if 'Origin' in rule and rule['Origin']:
    r['Origin'] = str(rule['Origin'])
  if 'ServerName' in rule and rule['ServerName']:
    r['ServerName'] = str(rule['ServerName'])
  if 'OriginArea' in rule and rule['OriginArea']:
    r['OriginArea'] = str(rule['OriginArea'])
  if 'RequestHeaders' in rule and rule['RequestHeaders']:
    r['RequestHeaders'] = rule['RequestHeaders']
  if 'FullMatch' in rule:
    r['FullMatch'] = bool(rule['FullMatch'])
  return r


def _merge_rules(existing, managed):
  managed_norm = [_normalize_rule(r) for r in managed]
  managed_paths = {r['Path'] for r in managed_norm}
  kept = [r for r in (existing or []) if str(r.get('Path')) not in managed_paths]
  return managed_norm + kept


def _compact_rules(rules):
  return [
    {
      'Path': r.get('Path'),
      'Regex': r.get('Regex'),
      'FullMatch': r.get('FullMatch'),
      'ForwardUri': r.get('ForwardUri'),
      'Origin': r.get('Origin'),
      'ServerName': r.get('ServerName'),
    }
    for r in rules
  ]


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('--domain', required=True)
  parser.add_argument('--rules-file', required=True)
  parser.add_argument('--mode', choices=['plan', 'apply'], default='plan')
  args = parser.parse_args()

  sid = os.getenv('TENCENT_SECRET_ID')
  skey = os.getenv('TENCENT_SECRET_KEY')
  if not sid or not skey:
    raise RuntimeError('Missing TENCENT_SECRET_ID / TENCENT_SECRET_KEY')

  managed_rules = _load_rules(args.rules_file)
  client = _client(sid, skey)

  try:
    domain_cfg = _describe_domain(client, args.domain)
    origin = deepcopy(domain_cfg.get('Origin') or {})
    if not origin:
      raise RuntimeError('Domain Origin config is empty, cannot update PathRules safely')

    before = origin.get('PathRules') or []
    after = _merge_rules(before, managed_rules)

    print('Domain:', args.domain)
    print('Existing PathRules:', len(before))
    print('New PathRules     :', len(after))
    print('\n--- Managed Rules Preview ---')
    print(json.dumps(_compact_rules(after[: len(managed_rules)]), ensure_ascii=False, indent=2))

    if args.mode == 'plan':
      print('\nPLAN ONLY. No API update executed.')
      return

    origin['PathRules'] = after
    req = models.UpdateDomainConfigRequest()
    req.from_json_string(json.dumps({'Domain': args.domain, 'Origin': origin}, ensure_ascii=False))
    resp = client.UpdateDomainConfig(req)
    print('\nApplied successfully:')
    print(resp.to_json_string())

  except TencentCloudSDKException as e:
    print(f'TencentCloud SDK error: {e}', file=sys.stderr)
    sys.exit(1)
  except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)


if __name__ == '__main__':
  main()
