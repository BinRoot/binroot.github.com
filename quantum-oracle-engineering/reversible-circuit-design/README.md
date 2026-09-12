# Lesson 4: Reversible by design

23 slides, approximately 40–45 minutes including three predictions and an
exit exercise. Assumes Lessons 2 and 3. Speaker notes are in `slides.md`.

From the course directory:

```sh
make reversible-circuit-design/index.html
make l4-evidence
```

The HTML build uses committed evidence and works without fetching Python
dependencies. The evidence target runs `demo.py` with its pinned Qiskit
dependency; it needs `uv` and network access on its first run.

Run the lab independently with `uv run demo.py` from this directory.
It checks miniature circuits for synchronous versus in-place color updates,
stranded equality work, prefix-counter cleanup order, Boolean payoff
copy-out, complex amplitudes, inverse composition, and one amplification
turn. It does **not** simulate the full 169-qubit oracle. The two-stone
example fixes dice to 0 and 3; the payoff example is a separate predicate
on two uniform bits with good probability 1/4.

Source mapping:

- QCE26 `qce26/paper/main.tex` in the companion `qcaai` repository:
  Section III for index/transition/evaluation phases and retained registers;
  Tables `tab:correctness` and `tab:scaling` for displayed resource counts.
- `../assets/l3-data.js`: Lesson 3's deterministic two-round trace, reused
  for round-boundary boards, move indices, and the selector-order example.
- `demo.py` → `../assets/l4-evidence.js`: executable evidence for the
  miniature examples drawn by `../assets/l4-lesson.js`.

The resource table reports pre-decomposition circuit counts, not hardware
timings or fault-tolerant costs. Sampled full-rollout basis tests are
regression evidence; the exhaustive and coherent checks in this lab apply
only to its small circuits.
