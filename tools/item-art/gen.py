#!/usr/bin/env python3
"""Schickt die Prompts aus prompts.json an ein laufendes ComfyUI (Krea 2 Turbo)
und speichert die PNGs in tools/item-art/raw/<key>.png. Nur Standardbibliothek."""
import argparse, json, pathlib, sys, time, urllib.request, urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / 'raw'


def call(base, path, data=None):
    req = urllib.request.Request(base + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def workflow(prompt, size, steps, seed, prefix):
    # Gleicher Aufbau wie die frueheren Tusche-Bilder (pnp_art): Krea 2 Turbo, 8 Schritte, cfg 1.
    return {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'krea2_turbo_fp8_scaled.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen3vl_4b_fp8_scaled.safetensors', 'type': 'krea2', 'device': 'default'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'qwen_image_vae.safetensors'}},
        '5': {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['2', 0], 'text': prompt}},
        '6': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['5', 0]}},
        '7': {'class_type': 'EmptyLatentImage', 'inputs': {'width': size, 'height': size, 'batch_size': 1}},
        '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['5', 0], 'negative': ['6', 0], 'latent_image': ['7', 0],
                                                    'seed': seed, 'steps': steps, 'cfg': 1.0, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1.0}},
        '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('base', help='ComfyUI-Adresse, z. B. http://127.0.0.1:8188')
    ap.add_argument('--only', nargs='*', help='nur diese Schluessel')
    ap.add_argument('--seed-offset', type=int, default=0)
    ap.add_argument('--force', action='store_true', help='auch vorhandene neu erzeugen')
    a = ap.parse_args()
    cfg = json.loads((HERE / 'prompts.json').read_text(encoding='utf-8'))
    RAW.mkdir(exist_ok=True)
    keys = a.only or list(cfg['items'])
    todo = [k for k in keys if a.force or not (RAW / f'{k}.png').exists()]
    print(f'{len(todo)} von {len(keys)} Bildern zu erzeugen')
    for n, key in enumerate(todo, 1):
        seed = 5000 + sorted(cfg['items']).index(key) * 7 + a.seed_offset
        wf = workflow(cfg['style'] + cfg['items'][key], cfg['size'], cfg['steps'], seed, f'itemart_{key}')
        pid = call(a.base, '/prompt', {'prompt': wf})['prompt_id']
        t0 = time.time()
        while True:
            hist = call(a.base, f'/history/{pid}')
            if pid in hist and hist[pid].get('outputs'):
                img = hist[pid]['outputs']['10']['images'][0]
                q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img['subfolder'], 'type': img['type']})
                with urllib.request.urlopen(f'{a.base}/view?{q}', timeout=60) as r:
                    (RAW / f'{key}.png').write_bytes(r.read())
                print(f'[{n}/{len(todo)}] {key} ({time.time() - t0:.0f}s)', flush=True)
                break
            if time.time() - t0 > 300:
                print(f'Zeitueberschreitung bei {key}', file=sys.stderr)
                break
            time.sleep(2)


if __name__ == '__main__':
    main()
