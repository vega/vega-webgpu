import json
import random
import os

def generate_data(num_points):
    data = []
    for _ in range(num_points):
        point = {"u": random.uniform(-1, 1), "v": random.uniform(-1, 1)}
        data.append(point)
    return data

def save_data(data, filename):
    with open(filename, 'w') as file:
        json.dump(data, file, indent=2)

def main():
    num_points = int(input("Enter the number of points: "))
    data = generate_data(num_points)
    filename = f"./data/data-N_{num_points}.json"
    save_data(data, filename)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    main()
