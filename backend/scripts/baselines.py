"""Baselines on the exact splits from experiments.js (run that first). python3 scripts/baselines.py"""
import json, statistics
from pathlib import Path
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

root = Path(__file__).resolve().parents[1] / "data"
rows = [l.rsplit("\t", 1) for l in (root / "raw/restaurant_reviews.tsv").read_text(encoding="utf8").splitlines()[1:] if l]
X = [r[0] for r in rows]; y = [int(r[1]) for r in rows]
exp = json.loads((root / "experiments.json").read_text())
models = {
    "Multinomial NB (scikit-learn, 1–2-grams)": lambda: make_pipeline(CountVectorizer(ngram_range=(1, 2)), MultinomialNB()),
    "Logistic regression (TF-IDF, 1–2-grams)": lambda: make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), LogisticRegression(max_iter=1000)),
    "Linear SVM (TF-IDF, 1–2-grams)": lambda: make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), LinearSVC()),
}
out = {}
for name, make in models.items():
    tr, te = exp["split"]["train"], exp["split"]["test"]
    m = make().fit([X[i] for i in tr], [y[i] for i in tr]); p = m.predict([X[i] for i in te]); t = [y[i] for i in te]
    ho = dict(accuracy=accuracy_score(t, p), precision=precision_score(t, p), recall=recall_score(t, p), f1=f1_score(t, p))
    accs, f1s = [], []
    for k, fold in enumerate(exp["cvFolds"]):
        trk = [i for j, f in enumerate(exp["cvFolds"]) if j != k for i in f]
        m = make().fit([X[i] for i in trk], [y[i] for i in trk]); p = m.predict([X[i] for i in fold]); t = [y[i] for i in fold]
        accs.append(accuracy_score(t, p)); f1s.append(f1_score(t, p))
    out[name] = dict(holdout=ho, cv=dict(accMean=statistics.mean(accs), accSd=statistics.stdev(accs), f1Mean=statistics.mean(f1s), f1Sd=statistics.stdev(f1s)))
    print(f"{name:45s} hold-out acc {ho['accuracy']:.3f} F1 {ho['f1']:.3f} | CV acc {statistics.mean(accs):.3f}±{statistics.stdev(accs):.3f} F1 {statistics.mean(f1s):.3f}±{statistics.stdev(f1s):.3f}")
(root / "baselines.json").write_text(json.dumps(out, indent=1))
