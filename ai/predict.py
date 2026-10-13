"""Command-line sentiment prediction using the bundled FoodSense TFLite model."""
import argparse
import json
from app import analyze

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("text", help="Review text to analyze")
    parser.add_argument("--rating", type=float, default=None, help="Optional 1-5 rating")
    args = parser.parse_args()
    print(json.dumps(analyze(args.text, args.rating), ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
