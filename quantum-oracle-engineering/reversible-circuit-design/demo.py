# /// script
# requires-python = ">=3.10"
# dependencies = ["qiskit==2.3.1"]
# ///
"""Executable miniature examples for Lesson 4; not the full 169-qubit oracle.

Run: uv run demo.py
Refresh the slide evidence: uv run demo.py --javascript > ../assets/l4-evidence.js
Color encoding: 0 = Black, 1 = White. Qubit 0 is the low-order bit.
"""

import json
import sys

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator, Statevector


def basis_output(circuit, initial):
    state = Statevector.from_int(initial, 2**circuit.num_qubits).evolve(circuit)
    result = int(np.argmax(state.probabilities()))
    assert np.isclose(state.probabilities()[result], 1)
    return [(result >> i) & 1 for i in range(circuit.num_qubits)]


def synchronous_spec(colors):
    # Two adjacent occupied cells, no other stones. Independent of gate code.
    dice = (0, 3)
    return [color ^ int(die < 4 - int(color == colors[1 - i]))
            for i, (color, die) in enumerate(zip(colors, dice))]


def synchronous_event():
    # old[0:2], new[2:4], scratch[4]; new and scratch initially zero.
    circuit = QuantumCircuit(5, name="synchronous event")
    circuit.cx(0, 2)
    circuit.cx(1, 3)
    circuit.x(2)  # die 0 always fires
    circuit.cx(0, 4)
    circuit.cx(1, 4)  # die 3 fires iff old colors differ
    circuit.cx(4, 3)
    circuit.cx(1, 4)
    circuit.cx(0, 4)
    return circuit


def in_place_event():
    # colors[0:2], scratch[2]. Reversible gates, wrong synchronous semantics.
    circuit = QuantumCircuit(3, name="in-place event")
    circuit.x(0)
    circuit.cx(0, 2)
    circuit.cx(1, 2)
    circuit.cx(2, 1)
    circuit.cx(1, 2)  # also attempts cleanup using a changed input
    circuit.cx(0, 2)
    return circuit


def prefix_scan():
    # Nine occupancy bits and a four-bit prefix counter, initially zero.
    circuit = QuantumCircuit(13, name="count empties")
    counter = list(range(9, 13))
    for cell in range(9):
        circuit.x(cell)  # negative occupancy control
        for bit in reversed(range(4)):
            controls = [cell] + counter[:bit]
            circuit.mcx(controls, counter[bit])
        circuit.x(cell)
    return circuit


def payoff_preparation():
    # A separate two-bit Boolean-payoff toy: good iff both bits are zero.
    # data[0:2], work[2], payoff[3]. Uniform data gives a = 1/4.
    work = QuantumCircuit(4, name="W")
    work.x([0, 1])
    work.ccx(0, 1, 2)
    work.x([0, 1])
    circuit = QuantumCircuit(4, name="A")
    circuit.h([0, 1])
    circuit.compose(work, inplace=True)
    circuit.cx(2, 3)
    circuit.compose(work.inverse(), inplace=True)
    return circuit


def verify():
    good, bad = synchronous_event(), in_place_event()
    assert basis_output(bad, 2)[:2] != synchronous_spec([0, 1])
    expected = np.zeros(32, dtype=complex)
    for initial in range(4):
        colors = [initial & 1, (initial >> 1) & 1]
        output = synchronous_spec(colors)
        assert basis_output(good, initial) == colors + output + [0]
        index = initial + (output[0] << 2) + (output[1] << 3)
        expected[index] = 0.5
    coherent = QuantumCircuit(5)
    coherent.h([0, 1])
    coherent.compose(good, inplace=True)
    assert np.allclose(Statevector.from_instruction(coherent).data, expected)
    # Full operator check on these tiny circuits, including unused inputs.
    for circuit in (good, bad):
        roundtrip = circuit.compose(circuit.inverse())
        assert np.allclose(Operator(roundtrip).data, np.eye(2**circuit.num_qubits))

    stranded = QuantumCircuit(3)
    stranded.x(2)
    stranded.cx(0, 2)
    stranded.cx(1, 2)  # scratch = (color0 == color1)
    stranded.x(0)
    stranded.cx(1, 2)
    stranded.cx(0, 2)
    stranded.x(2)
    assert basis_output(stranded, 0) == [1, 0, 1]

    scan = prefix_scan()
    initial_occ = (1 << 1) | (1 << 4)  # Lesson 3, round 2, before Black's move
    late = scan.copy()
    late.x(3)  # rank 2 selects cell 3
    late.compose(scan.inverse(), inplace=True)
    early = scan.compose(scan.inverse())
    early.x(3)
    counter = lambda bits: sum(b << i for i, b in enumerate(bits[9:13]))
    assert counter(basis_output(scan, initial_occ)) == 7
    assert counter(basis_output(late, initial_occ)) == 1
    assert counter(basis_output(early, initial_occ)) == 0

    a = payoff_preparation()
    state = Statevector.from_instruction(a)
    expected_payoff = np.zeros(16, dtype=complex)
    expected_payoff[[8, 1, 2, 3]] = 0.5
    assert np.allclose(state.data, expected_payoff)
    assert np.isclose(state.probabilities([2])[1], 0)
    assert np.isclose(state.probabilities([3])[1], 0.25)
    assert np.isclose(state.evolve(a.inverse()).probabilities()[0], 1)
    phase = QuantumCircuit(4)
    phase.z(3)
    reflected = state.evolve(phase).evolve(a.inverse())
    assert np.isclose(reflected.probabilities()[0], 0.25)
    # S0 flips |0000>; Q is applied in time order Sgood, A†, S0, A.
    s0 = QuantumCircuit(4)
    s0.x(range(4))
    s0.h(3)
    s0.mcx([0, 1, 2], 3)
    s0.h(3)
    s0.x(range(4))
    amplified = reflected.evolve(s0).evolve(a)
    assert np.isclose(amplified.probabilities([3])[1], 1)

    return {
        "scope": "miniature Qiskit circuits; not the full rollout",
        "event": {"initial": [0, 1], "dice": [0, 3],
                  "expected": synchronous_spec([0, 1]),
                  "correct": basis_output(good, 2),
                  "in_place": basis_output(bad, 2),
                  "basis_cases": 4, "coherent_amplitudes_match": True,
                  "correct_roundtrip": True, "wrong_roundtrip": True},
        "stranded": {"initial": [0, 0, 0], "final": basis_output(stranded, 0)},
        "counter": {"after_scan": 7, "late_cleanup": 1, "early_cleanup": 0},
        "payoff": {"a": 0.25, "work_one_probability": 0.0,
                   "plain_inverse_zero_probability": 1.0,
                   "marked_inverse_zero_probability": 0.25,
                   "after_one_q_good_probability": 1.0},
    }


if __name__ == "__main__":
    evidence = verify()
    if "--javascript" in sys.argv:
        print("// Generated by reversible-circuit-design/demo.py --javascript; do not edit.")
        print("window.L4_EVIDENCE = " + json.dumps(evidence, indent=2) + ";")
    else:
        print(json.dumps(evidence, indent=2))
        print("All checks passed.")
