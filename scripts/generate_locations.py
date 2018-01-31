"""
This script generates the locations.json file
for the NL height visualisation.
"""

import os
import sys
import json
import argparse


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Generate locations.json index for available evelation "
                    "profiles."
    )

    parser.add_argument('-b', '--base-path', default="/",
                        help="URL base path of JSON data as seen by the "
                             "browser.")
    parser.add_argument('-o', '--output', type=argparse.FileType('w'),
                        default=sys.stdout, help="Output file")

    parser.add_argument('metadata_file', nargs="+",
                        type=argparse.FileType('r'),
                        help="metadata.json file for a location")

    args = parser.parse_args()

    locations = {}
    for f in args.metadata_file:
        metadata = json.load(f)
        slug = metadata['properties']['name'].lower()
        metadata['properties']['slug'] = slug
        metadata['properties']['metadata_file'] = os.path.join(
            args.base_path, slug, 'metadata.json')

        locations[slug] = metadata

    json.dump(locations, args.output)
